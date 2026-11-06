import DailyPrayerView from "@/components/prayer/DailyPrayerView";
import { DAILY_PRAYERS } from "@/lib/oratorio/daily-prayers";

export default function OracaoDaManhaPage() {
  return <DailyPrayerView page={DAILY_PRAYERS["oracao-da-manha"]} />;
}
