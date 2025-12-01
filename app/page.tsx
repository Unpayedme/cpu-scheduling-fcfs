'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RefreshCw, Clock, Activity, BarChart3, AlertCircle } from 'lucide-react';

// --- Types & Interfaces ---

interface Process {
  id: number;
  arrivalTime: number;
  burstTime: number;
}

interface ProcessResult extends Process {
  startTime: number;
  completionTime: number;
  turnAroundTime: number;
  waitingTime: number;
}

interface ScheduleBlock {
  type: 'idle' | 'process';
  id?: number;
  startTime: number;
  endTime: number;
  duration: number;
}

interface CalculationResult {
  results: ProcessResult[];
  schedule: ScheduleBlock[];
  avgWT: string;
  avgTAT: string;
  utilization: string;
  totalTime: number;
}

// --- Main Component ---

const FCFSScheduler: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([
    { id: 1, arrivalTime: 0, burstTime: 4 },
    { id: 2, arrivalTime: 1, burstTime: 3 },
    { id: 3, arrivalTime: 2, burstTime: 1 },
  ]);
  const [nextId, setNextId] = useState<number>(4);
  const [inputArrival, setInputArrival] = useState<string | number>(0);
  const [inputBurst, setInputBurst] = useState<string | number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Sorting and Calculation Logic
  const calculatedResults: CalculationResult = useMemo(() => {
    // Sort by Arrival Time, then ID just to be deterministic
    const sortedProcesses = [...processes].sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id - b.id;
    });

    let currentTime = 0;
    const results: ProcessResult[] = [];
    const schedule: ScheduleBlock[] = []; // For Gantt Chart including idle times

    sortedProcesses.forEach((process) => {
      // Check for idle time
      if (currentTime < process.arrivalTime) {
        schedule.push({
          type: 'idle',
          startTime: currentTime,
          endTime: process.arrivalTime,
          duration: process.arrivalTime - currentTime,
        });
        currentTime = process.arrivalTime;
      }

      const startTime = currentTime;
      const completionTime = startTime + process.burstTime;
      const turnAroundTime = completionTime - process.arrivalTime;
      const waitingTime = turnAroundTime - process.burstTime;

      // Add to results
      results.push({
        ...process,
        startTime,
        completionTime,
        turnAroundTime,
        waitingTime,
      });

      // Add to schedule
      schedule.push({
        type: 'process',
        id: process.id,
        startTime,
        endTime: completionTime,
        duration: process.burstTime,
      });

      currentTime = completionTime;
    });

    // Calculate Averages
    const totalWT = results.reduce((acc, curr) => acc + curr.waitingTime, 0);
    const totalTAT = results.reduce((acc, curr) => acc + curr.turnAroundTime, 0);
    const avgWT = results.length > 0 ? (totalWT / results.length).toFixed(2) : '0';
    const avgTAT = results.length > 0 ? (totalTAT / results.length).toFixed(2) : '0';
    
    // Calculate Utilization
    const idleTime = schedule
      .filter(s => s.type === 'idle')
      .reduce((acc, s) => acc + s.duration, 0);
      
    const utilization = results.length > 0 && currentTime > 0 
      ? (((currentTime - idleTime) / currentTime) * 100).toFixed(1)
      : '0';

    return { results, schedule, avgWT, avgTAT, utilization, totalTime: currentTime };
  }, [processes]);

  const addProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setProcesses([
      ...processes,
      {
        id: nextId,
        arrivalTime: typeof inputArrival === 'string' ? parseInt(inputArrival) || 0 : inputArrival,
        burstTime: Math.max(1, typeof inputBurst === 'string' ? parseInt(inputBurst) || 1 : inputBurst),
      },
    ]);
    setNextId(nextId + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const removeProcess = (id: number) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  const resetData = () => {
    setProcesses([]);
    setNextId(1);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200 font-sans selection:bg-red-900 selection:text-white pb-12">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-red-900/30 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-white">
              FCFS <span className="text-red-500">SCHEDULER</span>
            </h1>
          </div>
          <div className="text-xs sm:text-sm font-mono text-red-400 border border-red-900/50 px-3 py-1 rounded bg-red-950/20">
            CPU_MODE: ACTIVE
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Process List */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-red-500" /> Add Process
              </h2>
              
              <form onSubmit={addProcess} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400 uppercase">Arrival Time</label>
                    <input
                      type="number"
                      min="0"
                      value={inputArrival}
                      onChange={(e) => setInputArrival(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400 uppercase">Burst Time</label>
                    <input
                      type="number"
                      min="1"
                      value={inputBurst}
                      onChange={(e) => setInputBurst(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-medium py-2 rounded-lg transition-all duration-300 transform active:scale-95 shadow-lg flex items-center justify-center group-hover:shadow-red-900/20"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add to Queue
                </button>
              </form>
            </div>

            {/* Process List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[500px]">
              <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-red-500" /> Process Queue
                </h2>
                <button 
                  onClick={resetData}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50 px-2 py-1 rounded transition-colors flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </button>
              </div>
              
              <div className="overflow-y-auto p-2 space-y-2 flex-grow custom-scrollbar">
                {processes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                    <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                    <p>No processes in queue</p>
                  </div>
                ) : (
                  processes.map((p) => (
                    <div 
                      key={p.id} 
                      className="group bg-neutral-800/50 hover:bg-neutral-800 border border-transparent hover:border-red-900/50 rounded-lg p-3 flex justify-between items-center transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center text-red-500 font-bold font-mono shadow-inner">
                          P{p.id}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase font-mono tracking-wider">Arrival: <span className="text-white">{p.arrivalTime}</span></div>
                          <div className="text-xs text-gray-500 uppercase font-mono tracking-wider">Burst: <span className="text-white">{p.burstTime}</span></div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProcess(p.id)}
                        className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-950/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard 
                label="Avg Waiting Time" 
                value={calculatedResults.avgWT} 
                unit="ms"
                icon={<Clock className="w-5 h-5 text-red-500" />}
              />
              <StatCard 
                label="Avg Turnaround" 
                value={calculatedResults.avgTAT} 
                unit="ms"
                icon={<RefreshCw className="w-5 h-5 text-red-500" />}
              />
              <StatCard 
                label="CPU Utilization" 
                value={calculatedResults.utilization} 
                unit="%"
                icon={<BarChart3 className="w-5 h-5 text-red-500" />}
                highlight={parseFloat(calculatedResults.utilization) > 80}
              />
            </div>

            {/* Gantt Chart Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-red-500" /> Gantt Chart Visualization
              </h2>
              
              <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
                {calculatedResults.schedule.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-lg text-gray-600 bg-neutral-950/30">
                    Add processes to generate schedule
                  </div>
                ) : (
                  <div className="flex relative min-w-full h-24 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                    {calculatedResults.schedule.map((block, index) => {
                      const widthPercent = (block.duration / calculatedResults.totalTime) * 100;
                      return (
                        <div
                          key={index}
                          style={{ width: `${widthPercent}%` }}
                          className={`relative h-full flex items-center justify-center border-r border-neutral-900 transition-all duration-500 ease-in-out group ${
                            block.type === 'idle' 
                              ? 'bg-transparent bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjMzMzIi8+PC9zdmc+")]' 
                              : 'bg-red-900/20 hover:bg-red-900/40'
                          }`}
                        >
                          {/* Inner Bar */}
                          {block.type === 'process' && (
                            <div className="absolute inset-y-2 inset-x-1 bg-gradient-to-br from-red-600 to-red-800 rounded shadow-md group-hover:from-red-500 group-hover:to-red-700 transition-all"></div>
                          )}
                          
                          {/* Label */}
                          <span className={`relative z-10 font-bold font-mono text-sm ${block.type === 'idle' ? 'text-gray-600' : 'text-white'}`}>
                            {block.type === 'idle' ? 'IDLE' : `P${block.id}`}
                          </span>

                          {/* Time Indicator - Start */}
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 -mb-6 text-xs font-mono text-gray-500">
                              {block.startTime}
                            </div>
                          )}
                          
                          {/* Time Indicator - End */}
                          <div className="absolute bottom-0 right-0 -mb-6 text-xs font-mono text-gray-500 transform translate-x-1/2">
                            {block.endTime}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-red-900 shadow-xl">
                              Start: {block.startTime} | End: {block.endTime} | Dur: {block.duration}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-red-900/30 bg-red-950/10 text-red-500 text-xs uppercase font-bold tracking-wider">
                      <th className="p-4">Process ID</th>
                      <th className="p-4">Arrival (AT)</th>
                      <th className="p-4">Burst (BT)</th>
                      <th className="p-4">Finish (CT)</th>
                      <th className="p-4">Turnaround (TAT)</th>
                      <th className="p-4">Waiting (WT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {calculatedResults.results.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="p-8 text-center text-gray-600">No data available</td>
                       </tr>
                    ) : (
                      calculatedResults.results.map((r, i) => (
                        <tr 
                          key={r.id} 
                          className="hover:bg-neutral-800/50 transition-colors group"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <td className="p-4 font-mono font-medium text-white group-hover:text-red-400">P{r.id}</td>
                          <td className="p-4 text-gray-400">{r.arrivalTime}</td>
                          <td className="p-4 text-gray-400">{r.burstTime}</td>
                          <td className="p-4 text-gray-400">{r.completionTime}</td>
                          <td className="p-4 text-red-300 font-medium bg-red-950/5">{r.turnAroundTime}</td>
                          <td className="p-4 text-red-300 font-medium bg-red-950/5">{r.waitingTime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-600 text-sm border-t border-neutral-900 mt-12">
        <p>FCFS CPU SCHEDULING ALGORITHM SIMULATOR</p>
      </footer>
    </div>
  );
};

// --- Helper Component for Stats ---

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, highlight = false }) => (
  <div className={`bg-neutral-900 border ${highlight ? 'border-red-600' : 'border-neutral-800'} rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-red-900/50 transition-colors group`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{label}</span>
      <div className="bg-neutral-950 p-2 rounded-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className="flex items-baseline">
      <span className={`text-3xl font-bold font-mono ${highlight ? 'text-red-500' : 'text-white'}`}>
        {value}
      </span>
      <span className="ml-1 text-sm text-gray-500 font-medium">{unit}</span>
    </div>
  </div>
);

export default FCFSScheduler;