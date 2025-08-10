import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const DAYS_OPTIONS = [7, 14, 30];

const StudyHistoryCharts = () => {
  const [days, setDays] = useState(7);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`/api/study/stats/daily`, {
          params: { days },
        });
        setDailyStats(Array.isArray(data) ? data.reverse() : []); // 古い日付→新しい日付に
      } catch (e) {
        console.error('Failed to fetch daily stats', e);
        setError('日別学習データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, [days]);

  const labels = useMemo(() => {
    return dailyStats.map((d) => {
      // d.date は YYYY-MM-DD 形式が想定
      const date = new Date(d.date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      }
      // フォールバック
      return d.date;
    });
  }, [dailyStats]);

  const totalCorrect = useMemo(
    () => dailyStats.reduce((sum, d) => sum + (Number(d.correct_answers) || 0), 0),
    [dailyStats]
  );
  const totalIncorrect = useMemo(
    () => dailyStats.reduce((sum, d) => sum + (Number(d.incorrect_answers) || 0), 0),
    [dailyStats]
  );

  const barData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: '正解',
          data: dailyStats.map((d) => Number(d.correct_answers) || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.7)', // green-500
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
          stack: 'answers',
        },
        {
          label: '不正解',
          data: dailyStats.map((d) => Number(d.incorrect_answers) || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.7)', // red-500
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          stack: 'answers',
        },
      ],
    }),
    [labels, dailyStats]
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: 'white' } },
        tooltip: { mode: 'index', intersect: false },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          stacked: true,
          ticks: { color: 'rgba(255,255,255,0.8)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: 'rgba(255,255,255,0.8)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
        },
      },
    }),
    []
  );

  const doughnutData = useMemo(
    () => ({
      labels: ['正解', '不正解'],
      datasets: [
        {
          data: [totalCorrect, totalIncorrect],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          borderWidth: 1,
        },
      ],
    }),
    [totalCorrect, totalIncorrect]
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'white' } },
      },
      cutout: '60%',
    }),
    []
  );

  return (
    <div className="glass-morphism rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">学習履歴</h3>
        <div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/20 border border-white/30 rounded-lg py-2 px-3 text-white"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                直近{opt}日
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-100 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white/10 rounded-xl p-4" style={{ height: 280 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/80 text-sm">読み込み中...</div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white/10 rounded-xl p-4 flex flex-col" style={{ height: 280 }}>
            <div className="text-white/80 text-sm mb-2">合計（直近{days}日）</div>
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full text-white/80 text-sm">読み込み中...</div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-white/90 text-sm">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <div className="text-xs text-white/70">正解</div>
                <div className="text-base font-semibold">{totalCorrect}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <div className="text-xs text-white/70">不正解</div>
                <div className="text-base font-semibold">{totalIncorrect}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-white/70 text-xs">
        ・棒グラフ: 日別の「正解/不正解」の積み上げ表示／・ドーナツ: 直近期間の合計内訳
      </div>
    </div>
  );
};

export default StudyHistoryCharts;


