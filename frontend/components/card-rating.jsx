 'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {api} from '../lib/api';
export default function CardRating({bookId,initialSummary}){const [summary,setSummary]=useState(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;if(initialSummary)return;api.reviews(bookId).then(data=>{if(active)setSummary({average:Number(data.average||0),count:Number(data.count||0)});}).catch(()=>{if(active)setFailed(true);});return ()=>{active=false;};},[bookId,initialSummary]);
 const current=initialSummary||summary;const average=Math.max(0,Math.min(5,current?.average||0)),count=current?.count||0;
 return <Link href={'/books/'+bookId+'#reviews'} className="card-rating" aria-label={current?(count?`${average.toLocaleString('vi-VN',{maximumFractionDigits:1})} trên 5 sao, ${count} đánh giá`:'Chưa có đánh giá'):failed?'Xem đánh giá':'Đang tải đánh giá'}><span className="rating-stars" aria-hidden="true"><span>★★★★★</span><span className="rating-stars-filled" style={{width:count?average/5*100+'%':'0%'}}>★★★★★</span></span><span>{current?(count?<><strong>{average.toLocaleString('vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1})}</strong> <span>({count})</span></>:'Chưa có đánh giá'):failed?'Xem đánh giá':'Đang tải…'}</span></Link>;
}
