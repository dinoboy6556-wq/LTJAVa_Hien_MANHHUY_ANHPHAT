export const BORROWING_POLICY_VERSION='2026-11-06-v1';
export default function BorrowingPolicy({expanded=false}){return <details className="borrowing-policy" open={expanded||undefined}><summary>Quy định mượn & giữ gìn sách</summary><div className="borrowing-policy-body">
  <dl>
    <div><dt>Giá mượn 1 ngày</dt><dd>Phí 14 ngày ÷ 14, tùy đầu sách</dd></div>
  </dl>
  <p>Ví dụ, sách có phí 14.000 đ / 14 ngày thì giá mượn 1 ngày là 1.000 đ / quyển. Phí cho mỗi quyển được tính theo số ngày bạn chọn và làm tròn lên đến đồng.</p>
  <dl><div><dt>Trả quá hạn</dt><dd>10.000 đ / quyển / ngày</dd></div><div><dt>Sách hư hỏng</dt><dd>50.000 đ / quyển</dd></div><div><dt>Mất sách</dt><dd>Theo giá bán của sách</dd></div></dl><p>Phí quá hạn có thể cộng thêm phí hư hỏng hoặc mất sách.</p><ul><li>Giữ sách khô sạch, không viết, gấp trang hoặc làm rách sách.</li><li>Kiểm tra sách khi nhận; báo thủ thư nếu sách đã hỏng hoặc thiếu trang để được ghi nhận.</li><li>Trả đúng hạn hoặc gia hạn khi đủ điều kiện.</li></ul></div></details>;}
