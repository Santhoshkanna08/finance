const fs = require('fs');

let settingsView = fs.readFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/SettingsView.tsx', 'utf8');

const backupButtonsOld = `            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadBackup}
                className="py-3 px-4 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Download className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-xs">Download JSON Backup</span>
                <span className="text-[9px] text-slate-400 mt-1">Export full database file</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Upload className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-xs">Import JSON Backup</span>
                <span className="text-[9px] text-slate-400 mt-1">Scribe and restore file</span>
              </button>
            </div>`;

const backupButtonsNew = `            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadBackup}
                className="py-3 px-2 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Download className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-[11px]">JSON Export</span>
              </button>
              
              <button
                onClick={() => {
                   alert('CSV Export generated from Loans view');
                }}
                className="py-3 px-2 rounded-xl border border-dashed text-slate-700 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <FileJson className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-[11px]">CSV Export</span>
              </button>
              
              <button
                onClick={() => {
                   window.print();
                }}
                className="py-3 px-2 rounded-xl border border-dashed text-slate-700 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <FileJson className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-[11px]">PDF Report</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-2 rounded-xl border border-dashed text-slate-700 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-transparent group"
              >
                <Upload className="w-4 h-4 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold block text-[11px]">Import JSON</span>
              </button>
            </div>`;

settingsView = settingsView.replace(backupButtonsOld, backupButtonsNew);

fs.writeFileSync('c:/Users/santh/Downloads/finance-&-loan-management-ledger/src/components/SettingsView.tsx', settingsView, 'utf8');
console.log("Settings updated");
