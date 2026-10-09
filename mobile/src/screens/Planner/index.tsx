/** The Planner tab: boards 16-tasks-and-reminders and 17-calendar. */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import type { TabParamList } from '../../navigation';
import { T } from '../../components/T';
import { Tap } from '../../components/ui';
import { fx } from '../../theme/effects';
import { CalendarView } from './CalendarView';
import { TasksView } from './TasksView';

type View_ = 'tasks' | 'calendar';

/** The Tasks / Calendar switch beside the title. */
export function PlannerHeader({
  view,
  onChange,
}: {
  view: View_;
  onChange(v: View_): void;
}) {
  const seg = (id: View_, label: string) =>
    view === id ? (
      <View
        accessibilityState={{ selected: true }}
        className="h-36 justify-center rounded-11 bg-white/60 px-14"
        style={fx.segment}
      >
        <T className="text-13 font-bold">{label}</T>
      </View>
    ) : (
      <Tap
        label={label}
        onPress={() => onChange(id)}
        className="h-36 justify-center rounded-11 px-14"
      >
        <T className="text-13 font-bold text-ink-body">{label}</T>
      </Tap>
    );
  return (
    <View className="flex-row items-center justify-between">
      <T
        accessibilityRole="header"
        className="text-30 font-medium tracking-[-0.9px]"
      >
        Planner
      </T>
      <View className="flex-row rounded-14 bg-peri-tonal p-4">
        {seg('tasks', 'Tasks')}
        {seg('calendar', 'Calendar')}
      </View>
    </View>
  );
}

export default function PlannerScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Planner'>>();
  const [view, setView] = useState<View_>(route.params?.view ?? 'tasks');
  useEffect(() => {
    if (route.params?.view) {
      setView(route.params.view);
    }
  }, [route.params?.view]);

  return view === 'tasks' ? (
    <TasksView header={<PlannerHeader view={view} onChange={setView} />} />
  ) : (
    <CalendarView header={<PlannerHeader view={view} onChange={setView} />} />
  );
}
