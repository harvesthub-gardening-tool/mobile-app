import { renderHook, act } from "@testing-library/react-native";

const mockTaps: Array<Record<string, unknown>> = [];
const mockPans: Array<Record<string, unknown>> = [];
const mockPinches: Array<Record<string, unknown>> = [];

jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Tap: jest.fn(() => {
      const g: Record<string, unknown> = {};
      g.onEnd = (cb: unknown) => {
        g.onEndCb = cb;
        return g;
      };
      mockTaps.push(g);
      return g;
    }),
    Pan: jest.fn(() => {
      const g: Record<string, unknown> = {};
      g.minPointers = () => g;
      g.onBegin = (cb: unknown) => {
        g.onBeginCb = cb;
        return g;
      };
      g.onChange = (cb: unknown) => {
        g.onChangeCb = cb;
        return g;
      };
      g.onEnd = (cb: unknown) => {
        g.onEndCb = cb;
        return g;
      };
      mockPans.push(g);
      return g;
    }),
    Pinch: jest.fn(() => {
      const g: Record<string, unknown> = {};
      g.manualActivation = () => g;
      g.onTouchesDown = (cb: unknown) => {
        g.onTouchesDownCb = cb;
        return g;
      };
      g.onTouchesMove = (cb: unknown) => {
        g.onTouchesMoveCb = cb;
        return g;
      };
      g.onTouchesUp = (cb: unknown) => {
        g.onTouchesUpCb = cb;
        return g;
      };
      g.onStart = (cb: unknown) => {
        g.onStartCb = cb;
        return g;
      };
      g.onUpdate = (cb: unknown) => {
        g.onUpdateCb = cb;
        return g;
      };
      g.onEnd = (cb: unknown) => {
        g.onEndCb = cb;
        return g;
      };
      mockPinches.push(g);
      return g;
    }),
    Race: (...args: unknown[]) => ({ type: "race", args }),
    Simultaneous: (...args: unknown[]) => ({ type: "simultaneous", args }),
  },
}));

const mockCancelAnimation = jest.fn();

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  useSharedValue: (value: number | boolean) => ({ value }),
  useAnimatedStyle: (cb: () => unknown) => cb(),
  withSpring: (value: number) => value,
  withDecay: ({ velocity }: { velocity: number }) => velocity,
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  cancelAnimation: (...args: unknown[]) => mockCancelAnimation(...args),
}));

import { useMapGestures } from "../../app/hooks/useMapGestures";
import { MAP_SIZE, MAX_SCALE, MIN_SCALE } from "../../app/constants/garden";

describe("useMapGestures", () => {
  beforeEach(() => {
    mockTaps.length = 0;
    mockPans.length = 0;
    mockPinches.length = 0;
    jest.clearAllMocks();
  });

  it("provides map controls and animated values", () => {
    const { result } = renderHook(() => useMapGestures());

    expect(result.current.composedGesture).toBeTruthy();
    expect(result.current.animatedStyle).toBeTruthy();
    expect(typeof result.current.mapAreaHeight).toBe("number");
  });

  it("invokes tap callback with absolute coordinates", () => {
    const onTap = jest.fn();
    renderHook(() => useMapGestures(onTap));

    const tap = mockTaps[0] as {
      onEndCb?: (e: { absoluteX: number; absoluteY: number }) => void;
    };
    act(() => {
      tap.onEndCb?.({ absoluteX: 44, absoluteY: 88 });
    });

    expect(onTap).toHaveBeenCalledWith(44, 88);
  });

  it("handles pan and pinch callbacks", () => {
    const { result } = renderHook(() => useMapGestures());

    const pan = mockPans[0] as {
      onBeginCb?: () => void;
      onChangeCb?: (e: { changeX: number; changeY: number }) => void;
      onEndCb?: (e: { velocityX: number; velocityY: number }) => void;
    };

    const pinch = mockPinches[0] as {
      onTouchesDownCb?: (
        e: { numberOfTouches: number; allTouches: Array<{ absoluteX: number; absoluteY: number }> },
        state: { begin: () => void; activate: () => void },
      ) => void;
      onTouchesMoveCb?: (e: {
        numberOfTouches: number;
        allTouches: Array<{ absoluteX: number; absoluteY: number }>;
      }) => void;
      onTouchesUpCb?: (e: { numberOfTouches: number }, state: { end: () => void }) => void;
      onStartCb?: () => void;
      onUpdateCb?: (e: { scale: number }) => void;
      onEndCb?: () => void;
    };

    const stateDown = { begin: jest.fn(), activate: jest.fn() };
    const stateUp = { end: jest.fn() };

    act(() => {
      pan.onBeginCb?.();
      pan.onChangeCb?.({ changeX: 10, changeY: 20 });
      pan.onEndCb?.({ velocityX: 3, velocityY: 4 });

      pinch.onTouchesDownCb?.(
        {
          numberOfTouches: 2,
          allTouches: [
            { absoluteX: 100, absoluteY: 120 },
            { absoluteX: 140, absoluteY: 160 },
          ],
        },
        stateDown,
      );
      pinch.onTouchesMoveCb?.({
        numberOfTouches: 2,
        allTouches: [
          { absoluteX: 110, absoluteY: 130 },
          { absoluteX: 150, absoluteY: 170 },
        ],
      });
      pinch.onStartCb?.();
      pinch.onUpdateCb?.({ scale: 1.6 });
      pinch.onEndCb?.();
      pinch.onTouchesUpCb?.({ numberOfTouches: 1 }, stateUp);
    });

    expect(stateDown.begin).toHaveBeenCalled();
    expect(stateDown.activate).toHaveBeenCalled();
    expect(stateUp.end).toHaveBeenCalled();
    expect(mockCancelAnimation).toHaveBeenCalled();

    expect(result.current.scale.value).toBeGreaterThanOrEqual(MIN_SCALE);
    expect(result.current.scale.value).toBeLessThanOrEqual(MAX_SCALE);
  });

  it("supports zoom in, zoom out, and recenter", () => {
    const { result } = renderHook(() => useMapGestures());

    const initialScale = result.current.scale.value;
    act(() => {
      result.current.zoomIn();
      result.current.zoomOut();
      result.current.recenter(null);
      result.current.recenter({
        minX: 100,
        minY: 200,
        maxX: 500,
        maxY: 700,
      });
    });

    expect(result.current.scale.value).toBeGreaterThanOrEqual(MIN_SCALE);
    expect(result.current.scale.value).toBeLessThanOrEqual(MAX_SCALE);
    expect(result.current.translateX.value).toBeLessThan(MAP_SIZE);
    expect(result.current.translateY.value).toBeLessThan(MAP_SIZE);
    expect(initialScale).toBeGreaterThan(0);
  });
});
