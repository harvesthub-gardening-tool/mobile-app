import { useCallback, useEffect } from "react";
import { Gesture, type TouchData } from "react-native-gesture-handler";
import {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDecay,
    runOnJS,
    cancelAnimation,
} from "react-native-reanimated";
import {
    MAP_SIZE,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    MIN_SCALE,
    MAX_SCALE,
    DECAY_DECELERATION,
} from "../constants/garden";

const MAP_AREA_HEIGHT = SCREEN_HEIGHT - 180;

function clampScale(value: number): number {
    "worklet";
    return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}

export function useMapGestures(
    onTap?: (screenX: number, screenY: number) => void,
) {
    const fitScale = Math.max(
        SCREEN_WIDTH / MAP_SIZE,
        MAP_AREA_HEIGHT / MAP_SIZE,
    );
    const initX = (SCREEN_WIDTH - MAP_SIZE * fitScale) / 2;
    const initY = (MAP_AREA_HEIGHT - MAP_SIZE * fitScale) / 2;

    const scale = useSharedValue(fitScale);
    const translateX = useSharedValue(initX);
    const translateY = useSharedValue(initY);

    const savedScale = useSharedValue(fitScale);
    const savedTranslateX = useSharedValue(initX);
    const savedTranslateY = useSharedValue(initY);

    const initialFocalX = useSharedValue(0);
    const initialFocalY = useSharedValue(0);
    const currentFocalX = useSharedValue(0);
    const currentFocalY = useSharedValue(0);

    const isPinching = useSharedValue(false);
    const didPinch = useSharedValue(false);
    const isCardInteracting = useSharedValue(false);

    const resetGestureState = useCallback(() => {
        cancelAnimation(scale);
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        isPinching.value = false;
        didPinch.value = false;
        isCardInteracting.value = false;
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
    }, [
        didPinch,
        isCardInteracting,
        isPinching,
        savedScale,
        savedTranslateX,
        savedTranslateY,
        scale,
        translateX,
        translateY,
    ]);

    useEffect(() => resetGestureState, [resetGestureState]);

    const tapGesture = Gesture.Tap().onEnd((e) => {
        if (onTap) {
            runOnJS(onTap)(e.absoluteX, e.absoluteY);
        }
    });

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .onBegin(() => {
            if (isCardInteracting.value) return;
            cancelAnimation(translateX);
            cancelAnimation(translateY);
        })
        .onChange((e) => {
            if (isPinching.value || isCardInteracting.value) return;
            translateX.value += e.changeX;
            translateY.value += e.changeY;
        })
        .onEnd((e) => {
            if (isCardInteracting.value) return;
            if (didPinch.value) {
                didPinch.value = false;
                return;
            }
            translateX.value = withDecay({
                velocity: e.velocityX,
                deceleration: DECAY_DECELERATION,
            });
            translateY.value = withDecay({
                velocity: e.velocityY,
                deceleration: DECAY_DECELERATION,
            });
        });

    const pinchGesture = Gesture.Pinch()
        .manualActivation(true)
        .onTouchesDown((_e, state) => {
            if (_e.numberOfTouches === 2) {
                const t0 = _e.allTouches[0] as TouchData;
                const t1 = _e.allTouches[1] as TouchData;
                currentFocalX.value = (t0.absoluteX + t1.absoluteX) / 2;
                currentFocalY.value = (t0.absoluteY + t1.absoluteY) / 2;
                state.begin();
                state.activate();
            }
        })
        .onTouchesMove((_e) => {
            if (_e.numberOfTouches !== 2) return;
            const t0 = _e.allTouches[0] as TouchData;
            const t1 = _e.allTouches[1] as TouchData;
            currentFocalX.value = (t0.absoluteX + t1.absoluteX) / 2;
            currentFocalY.value = (t0.absoluteY + t1.absoluteY) / 2;
        })
        .onTouchesUp((_e, state) => {
            if (_e.numberOfTouches < 2) {
                state.end();
            }
        })
        .onStart(() => {
            isPinching.value = true;
            didPinch.value = true;
            cancelAnimation(translateX);
            cancelAnimation(translateY);
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            initialFocalX.value = currentFocalX.value;
            initialFocalY.value = currentFocalY.value;
        })
        .onUpdate((e) => {
            const newScale = clampScale(savedScale.value * e.scale);

            const deltaX = currentFocalX.value - initialFocalX.value;
            const deltaY = currentFocalY.value - initialFocalY.value;

            const originX =
                (initialFocalX.value - savedTranslateX.value) /
                savedScale.value;
            const originY =
                (initialFocalY.value - savedTranslateY.value) /
                savedScale.value;

            scale.value = newScale;
            translateX.value =
                savedTranslateX.value -
                originX * (newScale - savedScale.value) +
                deltaX;
            translateY.value =
                savedTranslateY.value -
                originY * (newScale - savedScale.value) +
                deltaY;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            isPinching.value = false;
        });

    const composedGesture = Gesture.Race(
        tapGesture,
        Gesture.Simultaneous(panGesture, pinchGesture),
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        transformOrigin: "top left",
    }));

    const zoomIn = useCallback(() => {
        const newScale = clampScale(scale.value * 1.3);
        const centerX = SCREEN_WIDTH / 2;
        const centerY = MAP_AREA_HEIGHT / 2;
        const worldX = (centerX - translateX.value) / scale.value;
        const worldY = (centerY - translateY.value) / scale.value;
        scale.value = withSpring(newScale);
        translateX.value = withSpring(centerX - worldX * newScale);
        translateY.value = withSpring(centerY - worldY * newScale);
        savedScale.value = newScale;
    }, [scale, translateX, translateY, savedScale]);

    const zoomOut = useCallback(() => {
        const newScale = clampScale(scale.value * 0.7);
        const centerX = SCREEN_WIDTH / 2;
        const centerY = MAP_AREA_HEIGHT / 2;
        const worldX = (centerX - translateX.value) / scale.value;
        const worldY = (centerY - translateY.value) / scale.value;
        scale.value = withSpring(newScale);
        translateX.value = withSpring(centerX - worldX * newScale);
        translateY.value = withSpring(centerY - worldY * newScale);
        savedScale.value = newScale;
    }, [scale, translateX, translateY, savedScale]);

    const recenter = useCallback(
        (
            bounds: {
                minX: number;
                minY: number;
                maxX: number;
                maxY: number;
            } | null,
        ) => {
            if (!bounds) return;
            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;
            const contentW = bounds.maxX - bounds.minX + 100;
            const contentH = bounds.maxY - bounds.minY + 100;
            const newScale = Math.min(
                SCREEN_WIDTH / contentW,
                MAP_AREA_HEIGHT / contentH,
                1.5,
            );

            const newX = SCREEN_WIDTH / 2 - centerX * newScale;
            const newY = MAP_AREA_HEIGHT / 2 - centerY * newScale;

            scale.value = withSpring(newScale);
            translateX.value = withSpring(newX);
            translateY.value = withSpring(newY);
            savedScale.value = newScale;
            savedTranslateX.value = newX;
            savedTranslateY.value = newY;
        },
        [
            scale,
            translateX,
            translateY,
            savedScale,
            savedTranslateX,
            savedTranslateY,
        ],
    );

    return {
        composedGesture,
        animatedStyle,
        scale,
        translateX,
        translateY,
        isCardInteracting,
        zoomIn,
        zoomOut,
        recenter,
        resetGestureState,
        mapAreaHeight: MAP_AREA_HEIGHT,
    };
}
