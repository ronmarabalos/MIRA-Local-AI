import { useState } from 'react';
import { View } from 'react-native';
import type { ReportItem } from '../core/report';
import { T } from './T';
import { Tap } from './ui';

/** The same source treatment on report rows and the full message. */
export function SourceQuote({
  item,
  appLabel,
  dark = false,
  expandable = false,
}: {
  item: ReportItem;
  appLabel?: string;
  dark?: boolean;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = item.message.text.length > 240 || item.message.text.split('\n').length > 3;
  return (
    <View className={`gap-6 rounded-14 p-12 ${dark ? 'bg-white/10' : 'bg-white/60'}`}>
      <T className={`text-12 font-semibold ${dark ? 'text-dk-text3' : 'text-ink-2'}`}>
        {`${appLabel || item.message.packageName} · ${item.chat.title}`}
      </T>
      <T
        selectable={expandable}
        numberOfLines={expandable && (!long || expanded) ? undefined : 3}
        className={`text-14 leading-[22px] ${dark ? 'text-dk-text' : 'text-ink-body'}`}
      >
        {`“${item.message.text}”`}
      </T>
      {expandable && long ? (
        <Tap
          label={expanded ? 'Show less' : 'Show all'}
          onPress={() => setExpanded(!expanded)}
          className="min-h-48 justify-center"
        >
          <T className={`text-14 font-semibold ${dark ? 'text-dk-accent' : 'text-navy'}`}>
            {expanded ? 'Show less' : 'Show all'}
          </T>
        </Tap>
      ) : null}
      {item.message.truncated ? (
        <T className={`text-12 ${dark ? 'text-dk-text3' : 'text-ink-2'}`}>
          The notification contained only part of this message.
        </T>
      ) : null}
    </View>
  );
}
