import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { fireEvent, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import { PrescriptionPeriodCard } from "../components/PrescriptionPeriodCard";

const mockDateTimePickerAndroidOpen = jest.fn();

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockDateTimePicker = ({
    value,
    mode,
    display,
    onChange,
  }: {
    readonly value: Date;
    readonly mode: string;
    readonly display?: string;
    readonly onChange: (event: DateTimePickerEvent, date?: Date) => void;
  }) =>
    React.createElement(View, {
      testID: "mock-date-picker",
      value,
      mode,
      display,
      onChange,
    });

  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: (...args: unknown[]) => mockDateTimePickerAndroidOpen(...args),
    },
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Text: ({ children, ...props }: { readonly children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

interface CreatePropsOverrides {
  readonly onSelectDate?: (field: "startDate" | "endDate", date: Date) => void;
}

function createProps(overrides?: CreatePropsOverrides) {
  return {
    startDateLabel: "2026-05-01",
    endDateLabel: "2026-05-07",
    startDateValue: new Date("2026-05-01T00:00:00.000Z"),
    endDateValue: new Date("2026-05-07T00:00:00.000Z"),
    onSelectDate: overrides?.onSelectDate ?? jest.fn(),
  };
}

function setPlatformOs(os: "ios" | "android") {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
}

describe("PrescriptionPeriodCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("복약 기간 카드와 날짜 라벨을 렌더링한다", () => {
    setPlatformOs("android");
    const props = createProps();

    const { getByText } = render(<PrescriptionPeriodCard {...props} />);

    expect(getByText("복약 기간")).toBeTruthy();
    expect(getByText("시작일")).toBeTruthy();
    expect(getByText("종료일")).toBeTruthy();
    expect(getByText("2026-05-01")).toBeTruthy();
    expect(getByText("2026-05-07")).toBeTruthy();
  });

  it("android에서 시작일 선택 시 DateTimePickerAndroid.open을 호출한다", () => {
    setPlatformOs("android");
    const props = createProps();

    const { getByLabelText } = render(<PrescriptionPeriodCard {...props} />);
    fireEvent.press(getByLabelText("복약 시작일 선택"));

    expect(mockDateTimePickerAndroidOpen).toHaveBeenCalledTimes(1);
    expect(mockDateTimePickerAndroidOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        value: props.startDateValue,
        mode: "date",
        onChange: expect.any(Function),
      }),
    );
  });

  it("android에서 날짜 확정 이벤트가 오면 onSelectDate를 호출한다", () => {
    setPlatformOs("android");
    const onSelectDate = jest.fn();
    const props = createProps({ onSelectDate });

    const { getByLabelText } = render(<PrescriptionPeriodCard {...props} />);
    fireEvent.press(getByLabelText("복약 종료일 선택"));

    const lastCall = mockDateTimePickerAndroidOpen.mock.calls.at(-1);
    const pickerOptions = lastCall?.[0] as {
      readonly onChange: (event: DateTimePickerEvent, date?: Date) => void;
    };
    const selectedDate = new Date("2026-05-09T00:00:00.000Z");

    pickerOptions.onChange({ type: "set" } as DateTimePickerEvent, selectedDate);

    expect(onSelectDate).toHaveBeenCalledWith("endDate", selectedDate);
  });

  it("ios에서 날짜 선택 후 완료 버튼 클릭 시 onSelectDate를 호출한다", () => {
    setPlatformOs("ios");
    const onSelectDate = jest.fn();
    const props = createProps({ onSelectDate });

    const { getByLabelText, getByTestId } = render(<PrescriptionPeriodCard {...props} />);

    fireEvent.press(getByLabelText("복약 종료일 선택"));

    const selectedDate = new Date("2026-05-10T00:00:00.000Z");
    fireEvent(
      getByTestId("mock-date-picker"),
      "onChange",
      { type: "set" } as DateTimePickerEvent,
      selectedDate,
    );
    fireEvent.press(getByLabelText("날짜 선택 완료"));

    expect(onSelectDate).toHaveBeenCalledWith("endDate", selectedDate);
  });
});
