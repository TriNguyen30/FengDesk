import fetchHttpClient from "@/lib/httpClient";

/**
 * Vendor tự đẩy trạng thái giao (Preparing → Shipped, Shipped → Delivered) qua endpoint THẬT — BE kiểm owner /
 * nhân viên được giao và tính hợp lệ của bước chuyển. Trước đây màn này gọi các hàm `devMark…` bên dưới; các
 * endpoint dev đó chỉ mở ở môi trường Development nên ở production sẽ trả 404.
 */
export async function updateDeliveryStatusRequest(deliveryId: string, status: "Shipped" | "Delivered") {
  const { data } = await fetchHttpClient.patch(`/orders/deliveries/${deliveryId}/status`, { status });
  return data;
}

// --- DevDeliveries endpoints ---

export async function devMarkDeliveryShippingDelivered(deliveryId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/${deliveryId}/shipping/delivered`);
  return data;
}

export async function devMarkDeliveryShippingFailed(deliveryId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/${deliveryId}/shipping/delivery-failed`);
  return data;
}

export async function devMarkDeliveryDelivering(deliveryId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/${deliveryId}/shipping/delivering`);
  return data;
}

export async function devGetDeliveryByOrderId(orderId: string) {
  const { data } = await fetchHttpClient.get(`/dev/deliveries/orders/${orderId}`);
  return data;
}

export async function devMarkOrderShippingDelivered(orderId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/orders/${orderId}/shipping/delivered`);
  return data;
}

export async function devMarkOrderShippingFailed(orderId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/orders/${orderId}/shipping/delivery-failed`);
  return data;
}

export async function devMarkDeliveryDelivered(deliveryId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/${deliveryId}/delivered`);
  return data;
}

export async function devMarkOrderDelivered(orderId: string) {
  const { data } = await fetchHttpClient.post(`/dev/deliveries/orders/${orderId}/delivered`);
  return data;
}
