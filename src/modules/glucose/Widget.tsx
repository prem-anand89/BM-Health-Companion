import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { glucoseLogsTable, fmtGlucose, toMgDl } from './db';
import { getPreferences } from '../../core/preferences';
import { Card, AccentBadge } from '../../components/ui';
import { DropIcon, ChevronRightIcon } from '../../components/icons';

export function GlucoseWidget() {
  const prefs = getPreferences();
  const latest = useLiveQuery(
    () => glucoseLogsTable().orderBy('recordedAt').last(),
    [],
  );

  const inRange =
    latest != null &&
    toMgDl(latest.value, latest.unit) >= prefs.glucoseTargetMin &&
    toMgDl(latest.value, latest.unit) <= prefs.glucoseTargetMax;

  return (
    <Link to="/m/glucose" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="indigo">
            <DropIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Blood Glucose</p>
            {latest ? (
              <p className={`text-sm ${inRange ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmtGlucose(latest.value, latest.unit)} · {latest.context}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No readings yet — tap to log</p>
            )}
          </div>
          <ChevronRightIcon className="text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
