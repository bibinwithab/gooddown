// src/components/BillTemplate.jsx

function formatBillNumber(billId, timestamp) {
  const year = new Date(timestamp || Date.now()).getFullYear();
  const padded = String(billId).padStart(4, "0");
  // JA = Jobin Agency
  return `JA-${year}-${padded}`;
}

function BillTemplate({ data }) {
  if (!data) return null;

  const { bill, items, owner_name } = data;

  const billDate = bill?.bill_timestamp
    ? new Date(bill.bill_timestamp)
    : new Date();

  const formattedDate = billDate.toLocaleDateString("en-IN");
  const formattedTime = billDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalAmount = Number(bill.total_amount || 0).toFixed(2);

  return (
    <div className="slip-wrapper">
      <div className="slip-paper">
        {/* Header */}
        <div className="slip-header">
          <h1>JOBIN AGENCY</h1>
          <p>Construction Material &amp; Transport Services</p>

          {/* ⬇️ Replace this with your real address */}
          <p>Goodown Road, Nagercoil – 629001</p>

          {/* ⬇️ Replace with your actual GSTIN */}
          <p>GSTIN: 33ABCDE1234F1Z5</p>
        </div>

        {/* Bill meta */}
        <div className="slip-meta">
          <div>
            <span className="label">Bill No:</span>
            <span>{formatBillNumber(bill.bill_id, bill.bill_timestamp)}</span>
          </div>
          <div>
            <span className="label">Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className="label">Time:</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="slip-separator" />

        {/* Party / vehicle */}
        <div className="slip-party">
          <div>
            <span className="label">Owner:</span>
            <span>{owner_name}</span>
          </div>
          <div>
            <span className="label">Vehicle:</span>
            <span>{bill.vehicle_number}</span>
          </div>
        </div>

        <div className="slip-separator dotted" />

        {/* Items list */}
        <div className="slip-items">
          <div className="slip-items-header">
            <span className="col-material">Material</span>
            <span className="col-qty">Qty</span>
            <span className="col-rate">Rate</span>
            <span className="col-amt">Amt</span>
          </div>

          {items.map((item, idx) => (
            <div className="slip-item-row" key={item.transaction_id || idx}>
              <span className="col-material">
                {idx + 1}. {item.material_name}
              </span>
              <span className="col-qty">{item.quantity}</span>
              <span className="col-rate">
                {Number(item.rate_at_sale).toFixed(0)}
              </span>
              <span className="col-amt">
                {Number(item.total_cost).toFixed(0)}
              </span>
            </div>
          ))}
        </div>

        <div className="slip-separator" />

        {/* Total */}
        <div className="slip-total-row">
          <span className="label">Total:</span>
          <span className="amount">₹ {totalAmount}</span>
        </div>

        <div className="slip-separator dotted" />

        {/* Footer */}
        <div className="slip-footer">
          <p>Amount credited to owner ledger.</p>
          <p>** Computer generated bill **</p>
          <div className="slip-sign">
            <div className="sign-line" />
            <div>Authorized</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillTemplate;
