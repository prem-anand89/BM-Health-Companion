import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { bristolLogsTable, BRISTOL_TYPES } from './db';
import { Card, AccentBadge } from '../../components/ui';
import { LeafIcon, ChevronRightIcon } from '../../components/icons';

export function BristolWidget() {
  const latest = useLiveQuery(
    () => bristolLogsTable().orderBy('recordedAt').last(),
    [],
  );

  const typeInfo = latest ? BRISTOL_TYPES.find((t) => t.type === latest.type) : null;

  return (
    <Link to="/m/bristol" className="block">
      <Card className="active:scale-[0.99] transition">
        <div className="flex items-center gap-4">
          <AccentBadge accent="rose">
            <LeafIcon />
          </AccentBadge>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800">Bowel Health</p>
            {typeInfo ? (
              <p className="text-sm text-slate-500">
                Last: {typeInfo.label} · {typeInfo.description}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No entries yet — tap to log</p>
            )}
          </div>
          <ChevronRightIcon className="text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
