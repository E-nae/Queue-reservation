'use client';

import { useTicketQueue } from '../hooks/useTicketQueue';
import { NumberTicker } from '../components/NumberTicker';
import { motion, AnimatePresence } from 'framer-motion';

// 가상의 사용자 ID (실제로는 로그인 세션에서 가져오기)
const USER_ID = 'user_' + Math.floor(Math.random() * 10000);

export default function BookingPage() {
  const { status, myRank, initialRank, errorMessage, joinQueue, buyTicket } = useTicketQueue(USER_ID);

  // 진행률 계산 (100% - (현재등수 / 초기등수 * 100))
  const progress = myRank && initialRank 
    ? Math.max(0, 100 - (myRank / initialRank) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans text-neutral-100">
        <div className="w-full max-w-md">
            
            <AnimatePresence mode="wait">
            {/* 상태 1: 입장 전 (버튼 클릭 유도) */}
            {status === 'idle' && (
                <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
                >
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        SUPER CONCERT 2026
                    </h1>
                    <p className="text-neutral-400">티켓 오픈: 2026.01.06 20:00</p>
                    <button 
                        onClick={joinQueue}
                        className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        예매 대기열 진입하기
                    </button>
                </motion.div>
            )}

            {/* 상태 2: 대기 중 (Waiting Room) */}
            {status === 'waiting' && (
                <motion.div 
                    key="waiting"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
                >
                {/* 배경 장식용 원 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 text-center space-y-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20 animate-pulse">
                            접속자가 많아 대기 중입니다
                        </div>
                        <h2 className="text-neutral-400 text-sm">내 앞의 대기 인원</h2>
                        
                        {/* 숫자 롤링 애니메이션 */}
                        <div className="text-7xl font-black tracking-tighter text-white tabular-nums">
                            <NumberTicker value={myRank || 0} />
                        </div>
                    </div>

                    {/* 프로그레스 바 */}
                    <div className="space-y-2">
                        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500">
                            <span>입장 대기</span>
                            <span>입장까지 약 {progress.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
                </motion.div>
            )}

            {/* 상태 3: 입장 성공 & 주문 (Active) */}
            {status === 'entered' && (
                <motion.div 
                    key="entered"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white text-black p-8 rounded-2xl shadow-2xl text-center space-y-6"
                >
                    <div className="text-green-600 font-bold text-xl">🎉 입장 성공!</div>
                    <h2 className="text-3xl font-bold">좌석을 확보하세요</h2>
                    <p className="text-neutral-500">5분 안에 결제하지 않으면 대기열로 돌아갑니다.</p>
                    
                    <button 
                        onClick={buyTicket}
                        className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-neutral-800 transition-transform active:scale-95"
                    >
                        결제하기 (110,000원)
                    </button>
                </motion.div>
            )}

            {/* 상태: 서버 오류 */}
            {status === 'error' && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-neutral-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl text-center space-y-6"
                >
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-white">대기열에 접속하지 못했어요</h2>
                    <p className="text-neutral-400">{errorMessage}</p>
                    <button
                        onClick={joinQueue}
                        className="w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        다시 시도하기
                    </button>
                </motion.div>
            )}

            {/* 상태 4: 결제 완료 */}
            {status === 'success' && (
                <motion.div 
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="text-6xl">🎫</div>
                    <h1 className="text-3xl font-bold text-white">예매가 완료되었습니다!</h1>
                    <p className="text-neutral-400">마이페이지에서 티켓을 확인하세요.</p>
                </motion.div>
            )}
            </AnimatePresence>

        </div>
    </div>
  );
}