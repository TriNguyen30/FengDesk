import Modal from "@/components/ui/Modal";

const noop = () => {};

export function Default() {
  return (
    <Modal open title="Xác nhận đặt hàng" onClose={noop}>
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
        Bạn có chắc chắn muốn đặt đơn hàng gồm 3 sản phẩm với tổng giá trị{" "}
        <strong>1.250.000đ</strong> không?
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <button
          onClick={noop}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Huỷ
        </button>
        <button
          onClick={noop}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#7d8f69",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Xác nhận
        </button>
      </div>
    </Modal>
  );
}

export function Large() {
  return (
    <Modal open title="Chi tiết cây phong thủy" onClose={noop} size="max-w-2xl">
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
        Cây Kim Tiền hợp mệnh Mộc và Hoả, mang ý nghĩa chiêu tài, giữ lộc. Thích hợp đặt tại bàn
        làm việc hoặc phòng khách hướng Đông Nam.
      </p>
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginTop: 8 }}>
        Ánh sáng: gián tiếp. Tưới nước: 1 lần/tuần. Chiều cao: 40-60cm.
      </p>
    </Modal>
  );
}

export function NoTitle() {
  return (
    <Modal open onClose={noop}>
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
        Đã thêm sản phẩm vào giỏ hàng.
      </p>
    </Modal>
  );
}
