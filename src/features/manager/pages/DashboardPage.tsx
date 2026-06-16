import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";

const data = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 2100 },
  { name: "Mar", total: 800 },
  { name: "Apr", total: 1600 },
  { name: "May", total: 900 },
  { name: "Jun", total: 1700 },
  { name: "Jul", total: 2400 },
];

const stats = [
  {
    title: "Total Revenue",
    value: "₫45,231,000",
    icon: DollarSign,
    trend: "+20.1%",
    trendUp: true,
  },
  {
    title: "New Orders",
    value: "+350",
    icon: ShoppingBag,
    trend: "+15.2%",
    trendUp: true,
  },
  {
    title: "Active Users",
    value: "1,234",
    icon: Users,
    trend: "+5.4%",
    trendUp: true,
  },
  {
    title: "Sales Growth",
    value: "12.5%",
    icon: TrendingUp,
    trend: "-2.1%",
    trendUp: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your store's performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 text-primary rounded-full flex items-center justify-center">
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
              <span className="text-sm text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Orders</h2>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500">No recent orders to show.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
