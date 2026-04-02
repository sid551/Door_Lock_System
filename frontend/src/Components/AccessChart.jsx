import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getChartData } from "../utils/analyticsHelpers";

export default function AccessChart({ logs }) {
  const chartData = getChartData(logs, 7);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Access Attempts Over Time (Last 7 Days)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="success"
            stroke="#10b981"
            strokeWidth={2}
            name="Success"
          />
          <Line
            type="monotone"
            dataKey="failed"
            stroke="#ef4444"
            strokeWidth={2}
            name="Failed"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Total"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
