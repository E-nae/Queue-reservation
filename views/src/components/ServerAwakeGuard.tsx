'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_PATH || 'http://localhost:4000';

// 서버가 이 시간 안에 응답하면 매표소 화면 없이 바로 보여준다 (깜빡임 방지)
const SHOW_BOOTH_AFTER_MS = 700;
// 무료 서버가 깨어나는 데 걸리는 보통 시간
const TYPICAL_WAKE_SEC = 30;

type Phase = 'checking' | 'waking' | 'opening' | 'open';

/**
 * 무료 서버는 한동안 요청이 없으면 잠든다.
 * 깨어나는 동안 매표소 셔터가 조금씩 올라가고, 서버가 응답하면 끝까지 올라간 뒤 예매 화면이 나온다.
 */
export default function ServerAwakeGuard({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [elapsed, setElapsed] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();
    let awake = false;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (cancelled) return;
        if (res.ok) {
          awake = true;
          setPhase((p) => (p === 'checking' ? 'open' : 'opening'));
          return;
        }
      } catch {
        // 아직 자는 중
      }
      if (!cancelled) retryId = setTimeout(check, 2000);
    };
    check();

    const boothId = setTimeout(() => {
      if (!awake) setPhase((p) => (p === 'checking' ? 'waking' : p));
    }, SHOW_BOOTH_AFTER_MS);

    const tickId = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(retryId);
      clearTimeout(boothId);
      clearInterval(tickId);
    };
  }, []);

  // transitionend가 오지 않는 경우(백그라운드 탭 등)에도 결국 열리게 한다
  useEffect(() => {
    if (phase !== 'opening') return;
    const fallbackId = setTimeout(() => setPhase('open'), 1500);
    return () => clearTimeout(fallbackId);
  }, [phase, reduceMotion]);

  // 움직임 줄이기 설정이면 셔터 올라가는 장면 없이 바로 연다
  if (phase === 'open' || (phase === 'opening' && reduceMotion)) return <>{children}</>;
  if (phase === 'checking') return <div className="min-h-dvh" />;

  // 기다리는 동안엔 셔터가 최대 70%까지 천천히 올라간다 (끝까지는 서버가 깨어났을 때만)
  const lift = phase === 'opening' ? 100 : 70 * (1 - Math.exp(-elapsed / TYPICAL_WAKE_SEC));

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="booth" aria-hidden>
        <div className="booth-sign">매표소</div>
        <div className="booth-frame">
          <div className="booth-window">
            <div className="booth-counter-hole" />
            <div className="booth-counter" />
            <div className="booth-notice">곧 열어요</div>
            <div
              className="shutter"
              style={{
                transform: `translateY(-${lift}%)`,
                transition:
                  phase === 'opening'
                    ? 'transform 0.9s cubic-bezier(0.5, 0, 0.2, 1)'
                    : 'transform 1s linear',
              }}
              onTransitionEnd={() => {
                if (phase === 'opening') setPhase('open');
              }}
            >
              <div className="shutter-bar">
                <div className="shutter-handle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-[22rem]" role="status" aria-live="polite">
        <h1 className="font-display text-[1.875rem] leading-tight">
          {phase === 'opening' ? '문 열었어요' : '매표소 문을 여는 중이에요'}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          이 데모는 무료 서버에서 돌아가서, 한동안 손님이 없으면 서버가 잠들어요. 다시 깨어나는 데 보통 30~50초
          걸리고, 그 뒤로는 빠르게 움직여요.
        </p>

        <p className="mt-6 flex items-baseline justify-between border-t border-ink/15 pt-3 text-sm">
          <span className="text-ink-soft">기다린 시간</span>
          <span className="font-semibold tabular-nums">{elapsed}초</span>
        </p>

        {elapsed >= 70 && phase === 'waking' && (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            평소보다 오래 걸리고 있어요. 계속 깨우는 중이니 이 화면을 그대로 두세요.{' '}
            {elapsed >= 120 && (
              <button
                onClick={() => window.location.reload()}
                className="font-semibold text-cobalt underline underline-offset-4"
              >
                새로고침하기
              </button>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
