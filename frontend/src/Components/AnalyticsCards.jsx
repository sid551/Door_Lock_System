import { calculateStats, getDoorStatus } from "../utils/analyticsHelpers";

export default function AnalyticsCards({ logs }) {
  const stats = calculateStats(logs);
  const doorStatus = getDoorStatus(logs);

  const cards = [
    {
      title: "Today",
      value: stats.today,
      subtitle: `${stats.todaySuccess} success, ${stats.todayFailed} failed`,
      color: "bg-blue-500",
    },
    {
      title: "This Week",
      value: stats.week,
      subtitle: "Total attempts",
      color: "bg-green-500",
    },
    {
      title: "This Month",
      value: stats.month,
      subtitle: "Total attempts",
      color: "bg-purple-500",
    },
    {
      title: "Door Status",
      value: doorStatus.status === "active" ? "🟢 Active" : "🔒 Locked",
      subtitle: doorStatus.lastUser
        ? `Last: ${doorStatus.lastUser}`
        : "No activity",
      color: doorStatus.status === "active" ? "bg-green-600" : "bg-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.color} text-white rounded-lg p-5 shadow-lg`}
        >
          <h3 className="text-sm font-semibold opacity-90">{card.title}</h3>
          <p className="text-3xl font-bold mt-2">{card.value}</p>
          <p className="text-xs mt-1 opacity-80">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
