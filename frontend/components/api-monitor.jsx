'use client';

import { useEffect, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, CircleCheck, CircleX, Network, Trash2 } from 'lucide-react';

export default function ApiMonitor() {
  const [calls, setCalls] = useState([]);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const onCall = (event) => setCalls((items) => [event.detail, ...items].slice(0, 30));
    window.addEventListener('moc:api-call', onCall);
    return () => window.removeEventListener('moc:api-call', onCall);
  }, []);
  return <aside className={'api-monitor ' + (expanded ? 'monitor-expanded' : '')} aria-label="Theo dõi lời gọi API">
    <button className="monitor-head" onClick={() => setExpanded(!expanded)}><span className="monitor-pulse"><Activity size={16}/></span><span><b>API LIVE</b><small>{calls.length} request gần nhất</small></span><span className="monitor-head-actions"><Network size={15}/>{expanded ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}</span></button>
    {expanded && <div className="monitor-body"><div className="monitor-toolbar"><span>SPRING BOOT · /API/V1</span><button title="Xóa log" onClick={() => setCalls([])}><Trash2 size={14}/> Xóa</button></div>{calls.length ? calls.map((call, i) => <div className="api-row" key={call.path + '-' + i}><span className={'api-method method-' + String(call.method).toLowerCase()}>{call.method}</span><code>{call.path}</code><span className={call.ok ? 'api-ok' : 'api-fail'}>{call.ok ? <CircleCheck size={14}/> : <CircleX size={14}/>} {call.status}</span><small>{call.duration}ms</small></div>) : <div className="monitor-empty"><span className="monitor-dots"/><p>Chưa có request nào.</p><small>Mở trang sách để xem frontend gọi API.</small></div>}</div>}
  </aside>;
}
