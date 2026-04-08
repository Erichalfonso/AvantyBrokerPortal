"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { MOBILITY_LABELS, MobilityType } from "@/types";

interface StandingOrder {
  id: string;
  patientName: string;
  patientPhone: string;
  medicaidId?: string | null;
  pickupAddress: string;
  destinationAddress: string;
  appointmentTime: string;
  mobilityType: string;
  specialInstructions: string;
  providerId?: string | null;
  daysOfWeek: number[];
  startDate: string;
  endDate?: string | null;
  active: boolean;
  createdAt: string;
}

interface Provider {
  id: string;
  name: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StandingOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StandingOrder[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generateRange, setGenerateRange] = useState({ fromDate: "", toDate: "" });
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    patientName: "", patientPhone: "", medicaidId: "",
    pickupAddress: "", destinationAddress: "", appointmentTime: "",
    mobilityType: "ambulatory", specialInstructions: "",
    providerId: "", daysOfWeek: [] as number[],
    startDate: "", endDate: "",
  });

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/standing-orders", { credentials: "include" });
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetch("/api/providers?active=true", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setProviders)
      .catch(() => {});
  }, [fetchOrders]);

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const createOrder = async () => {
    const res = await fetch("/api/standing-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({
        patientName: "", patientPhone: "", medicaidId: "",
        pickupAddress: "", destinationAddress: "", appointmentTime: "",
        mobilityType: "ambulatory", specialInstructions: "",
        providerId: "", daysOfWeek: [], startDate: "", endDate: "",
      });
      fetchOrders();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/standing-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) fetchOrders();
  };

  const generateTrips = async (id: string) => {
    setGenerateResult(null);
    const res = await fetch(`/api/standing-orders/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(generateRange),
    });
    if (res.ok) {
      const data = await res.json();
      setGenerateResult(`Generated ${data.generated} trips`);
      setGenerating(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-muted">Loading standing orders...</div>;

  if (user?.role === "provider") {
    return <div className="text-center py-16 text-muted">Standing orders are managed by brokers and admins.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Standing Orders</h1>
          <p className="text-muted mt-1">Recurring trip templates for regular appointments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
        >
          + New Standing Order
        </button>
      </div>

      {generateResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {generateResult}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">New Standing Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Name *</label>
              <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Phone</label>
              <input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Medicaid ID</label>
              <input value={form.medicaidId} onChange={(e) => setForm({ ...form, medicaidId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Appointment Time *</label>
              <input type="time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Pickup Address *</label>
            <input value={form.pickupAddress} onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Destination *</label>
            <input value={form.destinationAddress} onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Mobility Type *</label>
              <select value={form.mobilityType} onChange={(e) => setForm({ ...form, mobilityType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                <option value="ambulatory">Ambulatory</option>
                <option value="wheelchair">Wheelchair</option>
                <option value="stretcher">Stretcher</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Provider</label>
            <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal">
              <option value="">Assign later</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Days of Week *</label>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`w-12 h-10 rounded-lg text-sm font-medium transition-colors ${
                    form.daysOfWeek.includes(i) ? "bg-teal text-white" : "bg-background border border-border text-navy hover:bg-gray-100"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createOrder} disabled={!form.patientName || !form.pickupAddress || !form.destinationAddress || form.daysOfWeek.length === 0 || !form.startDate || !form.appointmentTime}
              className="px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              Create Standing Order
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-navy text-sm rounded-lg hover:bg-background transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted">No standing orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-navy">{order.patientName}</p>
                  {order.medicaidId && <p className="text-xs text-muted">Medicaid: {order.medicaidId}</p>}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {order.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <p className="text-xs text-muted uppercase">Pickup</p>
                  <p className="text-navy">{order.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Destination</p>
                  <p className="text-navy">{order.destinationAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Time</p>
                  <p className="text-navy">{order.appointmentTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Mobility</p>
                  <p className="text-navy">{MOBILITY_LABELS[order.mobilityType as MobilityType] || order.mobilityType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted">Schedule:</span>
                {DAY_LABELS.map((label, i) => (
                  <span key={i} className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium ${
                    order.daysOfWeek.includes(i) ? "bg-teal text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {label[0]}
                  </span>
                ))}
                <span className="text-xs text-muted ml-2">
                  {new Date(order.startDate).toLocaleDateString()}
                  {order.endDate && ` - ${new Date(order.endDate).toLocaleDateString()}`}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <button onClick={() => toggleActive(order.id, order.active)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    order.active ? "border border-danger text-danger hover:bg-danger hover:text-white" : "border border-success text-success hover:bg-success hover:text-white"
                  }`}>
                  {order.active ? "Deactivate" : "Activate"}
                </button>
                {order.active && (
                  <>
                    {generating === order.id ? (
                      <div className="flex items-center gap-2">
                        <input type="date" value={generateRange.fromDate} onChange={(e) => setGenerateRange({ ...generateRange, fromDate: e.target.value })}
                          className="px-2 py-1.5 rounded border border-border bg-white text-navy text-xs" />
                        <span className="text-xs text-muted">to</span>
                        <input type="date" value={generateRange.toDate} onChange={(e) => setGenerateRange({ ...generateRange, toDate: e.target.value })}
                          className="px-2 py-1.5 rounded border border-border bg-white text-navy text-xs" />
                        <button onClick={() => generateTrips(order.id)} disabled={!generateRange.fromDate || !generateRange.toDate}
                          className="px-3 py-1.5 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
                          Generate
                        </button>
                        <button onClick={() => setGenerating(null)} className="px-3 py-1.5 border border-border text-navy text-xs rounded-lg">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setGenerating(order.id)}
                        className="px-3 py-1.5 bg-navy hover:bg-navy-dark text-white text-xs font-medium rounded-lg transition-colors">
                        Generate Trips
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
