import { useState, useEffect } from 'react';

type QueueStatus = 'idle' | 'waiting' | 'entered' | 'sold_out' | 'success' | 'error';

const API_PATH = process.env.NEXT_PUBLIC_API_PATH;
const DEFAULT_ERROR = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
// 순번 조회가 이 횟수만큼 연속으로 실패하면 에러 화면으로 전환
const MAX_POLL_FAILURES = 3;

// 실패 응답에서 서버가 보낸 메시지를 꺼냄 (JSON이 아니면 기본 문구)
async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (data?.message) return String(data.message);
  } catch {
    // HTML 에러 페이지 등
  }
  return DEFAULT_ERROR;
}

export function useTicketQueue(userId: string) {
  const [status, setStatus] = useState<QueueStatus>('idle');
  const [myRank, setMyRank] = useState<number | null>(null);
  const [initialRank, setInitialRank] = useState<number>(0); // 진행률 계산용
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fail = (message: string) => {
    setErrorMessage(message);
    setStatus('error');
  };

  // 1. 대기열 진입 (POST /queue/join)
  const joinQueue = async () => {
    setErrorMessage(null);
    setMyRank(null);
    setInitialRank(0);
    setStatus('waiting');
    try {
      const res = await fetch(`${API_PATH}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        console.error('Join failed:', res.status);
        fail(await readErrorMessage(res));
        return;
      }
      // 줄 선 순간의 순번을 바로 보여준다 (이후 상태 확인은 아래 폴링이 이어감)
      const data = await res.json().catch(() => null);
      if (typeof data?.rank === 'number') {
        setInitialRank(data.rank);
        setMyRank(data.rank);
      }
    } catch (error) {
      console.error('Join error', error);
      fail(DEFAULT_ERROR);
    }
  };

  // 2. 상태 확인 폴링 (GET /queue/status)
  useEffect(() => {
    if (status !== 'waiting') return;

    let failures = 0;
    const onFailure = (message: string) => {
      failures += 1;
      if (failures >= MAX_POLL_FAILURES) {
        clearInterval(intervalId);
        fail(message);
      }
    };

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_PATH}/queue/status?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          console.error('Polling failed:', res.status);
          onFailure(await readErrorMessage(res));
          return;
        }
        const data = await res.json();
        failures = 0;

        if (data.status === 'entered') {
          setStatus('entered'); // 입장 성공!
          clearInterval(intervalId);
        } else if (data.rank) {
          // 처음 순번을 저장해둠 (진행률 바 계산 위해)
          setInitialRank((prev) => prev || data.rank);
          setMyRank(data.rank);
        }
      } catch (e) {
        console.error('Polling error', e);
        onFailure(DEFAULT_ERROR);
      }
    }, 2000); // 2초마다 확인 (서버 부하 고려)

    return () => clearInterval(intervalId);
  }, [status, userId]);

  // 3. 예매 요청 (POST /purchase) - Lua Script 실행 트리거
  const buyTicket = async () => {
    setPurchaseError(null);
    setIsPurchasing(true);
    try {
      const res = await fetch(`${API_PATH}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quantity: 1 }),
      });
      if (!res.ok) {
        setPurchaseError(await readErrorMessage(res)); // 매진, 권한 없음, 서버 오류
        return;
      }
      const result = await res.json();
      if (result.success) setStatus('success');
      else setPurchaseError(result.message || DEFAULT_ERROR);
    } catch (e) {
      console.error('Purchase error', e);
      setPurchaseError('결제 요청을 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return { status, myRank, initialRank, errorMessage, purchaseError, isPurchasing, joinQueue, buyTicket };
}
