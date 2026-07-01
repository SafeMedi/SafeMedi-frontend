import { formatNotificationRelativeTime } from "@/utils/format-relative-time";

describe("formatNotificationRelativeTime", () => {
  const referenceDate = new Date("2026-04-07T09:00:00");

  it("1분 미만이면 방금 전을 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T08:59:30", referenceDate)).toBe("방금 전");
  });

  it("1시간 미만이면 분 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T08:50:00", referenceDate)).toBe("10분 전");
  });

  it("24시간 미만이면 시간 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T07:00:00", referenceDate)).toBe("2시간 전");
  });

  it("어제 알림이면 어제를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-06T18:30:00", referenceDate)).toBe("어제");
  });

  it("오늘 알림이면 시간 단위를 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-07T08:00:00", referenceDate)).toBe("1시간 전");
  });

  it("7일 이내면 n일 전을 반환한다", () => {
    expect(formatNotificationRelativeTime("2026-04-05T10:00:00", referenceDate)).toBe("2일 전");
  });
});
