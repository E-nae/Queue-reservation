'use client';

import { useTicketQueue } from '../hooks/useTicketQueue';
import { NumberTicker } from '../components/NumberTicker';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

// 가상의 사용자 ID (실제로는 로그인 세션에서 가져오기)
const USER_NO = Math.floor(Math.random() * 10000);
const USER_ID = 'user_' + USER_NO;

const EVENT_TITLE = 'SUPER CONCERT 2026';
const PRICE = '110,000원';

const STEPS = ['줄 서기', '결제', '예매 완료'] as const;

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

export default function BookingPage() {
  const { status, myRank, initialRank, errorMessage, purchaseError, isPurchasing, joinQueue, buyTicket } =
    useTicketQueue(USER_ID);

  const step = status === 'success' ? 2 : status === 'entered' ? 1 : 0;

  // 처음 받은 순서 대비 얼마나 줄었는지
  const progress = myRank && initialRank ? Math.max(0, 1 - (myRank - 1) / Math.max(initialRank - 1, 1)) : 0;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh px-4 py-8 sm:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <ol className="mb-8 flex gap-5 text-sm sm:mb-12" aria-label="예매 단계">
            {STEPS.map((label, i) => (
              <li
                key={label}
                aria-current={i === step ? 'step' : undefined}
                className={i === step ? 'font-semibold text-ink' : 'text-ink-soft/70'}
              >
                <span className="mr-1.5 tabular-nums">{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.article key="idle" {...fade} className="ticket">
                <div className="p-6 sm:p-10">
                  <h1 className="font-display text-[clamp(2.75rem,9vw,4.75rem)] leading-[0.92] tracking-tight">
                    SUPER
                    <br />
                    CONCERT 2026
                  </h1>
                  <TicketFacts />
                  <p className="mt-8 max-w-[34em] leading-relaxed text-ink-soft">
                    줄을 서면 앞사람부터 차례로 결제 화면이 열려요. 입장한 뒤에는 5분 안에 결제를 마쳐야 해요.
                  </p>
                  <button onClick={joinQueue} className="btn mt-6 sm:w-auto sm:min-w-56">
                    대기열에 줄 서기
                  </button>
                </div>
                <Stub />
              </motion.article>
            )}

            {status === 'waiting' && (
              <motion.div key="waiting" {...fade} className="slip-wrap mx-auto w-full max-w-[20rem]">
                <section className="slip px-7 py-10 text-center" aria-live="polite">
                  <p className="text-sm font-medium">{EVENT_TITLE} 대기 번호표</p>
                  <hr className="my-6 border-t-2 border-dashed border-ink/15" />

                  <p className="text-ink-soft">내 순서</p>
                  {myRank ? (
                    <p className="my-1 font-display text-[5.5rem] leading-none tabular-nums">
                      <NumberTicker value={myRank} />
                    </p>
                  ) : (
                    <p className="my-1 font-display text-[5.5rem] leading-none text-ink/20">···</p>
                  )}
                  <p className="text-ink-soft">{myRank ? '번째예요' : '번호를 받고 있어요'}</p>

                  <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
                    <motion.div
                      className="h-full rounded-full bg-cobalt"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {initialRank > 0 && (
                    <p className="mt-2 text-left text-xs text-ink-soft tabular-nums">
                      처음엔 {initialRank.toLocaleString()}번째였어요
                    </p>
                  )}

                  <hr className="my-6 border-t-2 border-dashed border-ink/15" />
                  <p className="text-xs leading-relaxed text-ink-soft">
                    순서가 오면 결제 화면이 저절로 열려요.
                    <br />
                    새로고침하면 처음부터 다시 줄을 서야 해요.
                  </p>
                </section>
              </motion.div>
            )}

            {status === 'entered' && (
              <motion.article key="entered" {...fade} className="ticket">
                <div className="p-6 sm:p-10">
                  <h1 className="font-display text-[clamp(2.5rem,8vw,4rem)] leading-none">입장했어요</h1>
                  <p className="mt-4 max-w-[34em] leading-relaxed text-ink-soft">
                    5분 안에 결제를 마쳐 주세요. 시간이 지나면 다시 줄을 서야 해요.
                  </p>
                  <TicketFacts />
                  <button onClick={buyTicket} disabled={isPurchasing} className="btn mt-8 sm:w-auto sm:min-w-64">
                    {isPurchasing ? '결제하는 중…' : `${PRICE} 결제하기`}
                  </button>
                  {purchaseError && (
                    <p role="alert" className="mt-4 text-sm font-medium text-alert">
                      {purchaseError}
                    </p>
                  )}
                </div>
                <Stub />
              </motion.article>
            )}

            {status === 'success' && (
              <motion.article key="success" {...fade} className="ticket">
                <div className="relative p-6 sm:p-10">
                  <motion.div
                    className="stamp absolute right-5 top-5 sm:right-10 sm:top-8"
                    initial={{ scale: 1.8, opacity: 0, rotate: -4 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 420, damping: 22 }}
                    aria-hidden
                  >
                    예매
                    <br />
                    완료
                  </motion.div>
                  <h1 className="max-w-[60%] font-display text-[clamp(2.5rem,8vw,4rem)] leading-none">
                    예매를 마쳤어요
                  </h1>
                  <p className="mt-4 max-w-[30em] leading-relaxed text-ink-soft">
                    {EVENT_TITLE} 입장권 1매가 내 것이 됐어요. 공연 당일 입구에서 예매 번호를 보여 주세요.
                  </p>
                  <TicketFacts />
                </div>
                <Stub number={USER_NO} />
              </motion.article>
            )}

            {status === 'error' && (
              <motion.section
                key="error"
                {...fade}
                className="rounded-[10px] border-l-4 border-alert bg-paper p-6 sm:p-10"
              >
                <h1 className="font-display text-3xl leading-tight sm:text-4xl">대기열에 들어가지 못했어요</h1>
                <p className="mt-3 max-w-[34em] leading-relaxed text-ink-soft">{errorMessage}</p>
                <button onClick={joinQueue} className="btn mt-6 sm:w-auto sm:min-w-56">
                  다시 줄 서기
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}

function TicketFacts() {
  const facts = [
    ['좌석', '전석 지정석'],
    ['가격', PRICE],
    ['매수', '1인 1매'],
  ];
  return (
    <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-ink/10 pt-5">
      {facts.map(([term, value]) => (
        <div key={term}>
          <dt className="text-xs text-ink-soft">{term}</dt>
          <dd className="mt-1 font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// 절취선 너머 띠. 예매가 끝나면 예매 번호가 찍힌다.
function Stub({ number }: { number?: number }) {
  return (
    <div className="ticket-stub flex items-center justify-between px-6 py-5 sm:flex-col sm:px-4 sm:py-8">
      <span className="font-display text-2xl tracking-[0.2em] sm:[writing-mode:vertical-rl]">입장권</span>
      <span className="text-right text-sm sm:text-center">
        {number !== undefined ? (
          <>
            예매 번호
            <br />
            <strong className="font-display text-xl tabular-nums">{String(number).padStart(4, '0')}</strong>
          </>
        ) : (
          '1매'
        )}
      </span>
    </div>
  );
}
