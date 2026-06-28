import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { bpLogsTable, classifyBP, bpCategoryLabel, bpCategoryColor } from './db';
import { Card, AccentBadge } from '../../components/ui';
import { HeartIcon, ChevronRightIcon } from '../../components/icons';

export function BPWidget() {
  const latest = useLiveQuery(
    () => bpLogsTable().orderBy('recordedAt').last(),
    [],
  );

  const cat = latest ? classifyBP(latest.systolic, latest.diastolic) : null;

  return (
    <Link to="/m/bloodpressure" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="sky">
            <HeartIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Blood Pressure</p>
            {latest ? (
              <p className={`text-sm ${cat ? bpCategoryColor(cat) : ''}`}>
                {latest.systolic}/{latest.diastolic} mmHg · {cat ? bpCategoryLabel(cat) : ''}
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
