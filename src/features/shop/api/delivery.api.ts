import fetchHttpClient from "@/lib/httpClient";

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
