import { useState, useEffect, useRef, useCallback } from 'react';
// import { message } from 'antd'; // 移除 antd message 依赖
import { GeetestResult } from '../api/auth'; // 引入 GeetestResult 类型

// 声明全局 initGeetest4 函数类型
declare global {
    interface Window {
        initGeetest4: (config: any, callback: (captcha: any) => void) => void;
    }
}

interface UseCaptchaOptions {
    captchaId?: string; // 允许外部传入 ID
    onSuccess?: (result: GeetestResult) => void;
    onError?: (error?: any) => void;
    onClose?: () => void;
}

export const useCaptcha = (options?: UseCaptchaOptions) => {
    const captchaId = options?.captchaId || import.meta.env.VITE_GEETEST_ID;
    const captchaRef = useRef<any>(null); // 存储 captcha 实例
    const [isCaptchaReady, setIsCaptchaReady] = useState(false);
    const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);

    // 存储 Promise 的 resolve 和 reject 函数
    const promiseActionsRef = useRef<{
        resolve: (value: GeetestResult) => void;
        reject: (reason?: any) => void;
    } | null>(null);

    useEffect(() => {
        if (!captchaId) {
            console.error("Geetest Captcha ID is missing. Please set VITE_GEETEST_ID in your environment variables.");
            // message.error("人机验证服务配置错误"); // 移除
            return;
        }

        if (typeof window.initGeetest4 === 'undefined') {
            // 尝试延迟初始化，等待脚本加载
            const timeoutId = setTimeout(() => {
                if (typeof window.initGeetest4 === 'undefined') {
                    console.error("Geetest script (gt4.js) still not loaded after delay.");
                    // message.error("人机验证脚本加载失败"); // 移除
                } else {
                    initializeGeetest();
                }
            }, 1000); // 延迟1秒尝试
            return () => clearTimeout(timeoutId); // 清理定时器
        } else {
            initializeGeetest();
        }

        // 清理函数
        return () => {
            console.log("Cleaning up Geetest instance");
            // Geetest v4 可能没有显式的 destroy 方法
            captchaRef.current = null;
            setIsCaptchaReady(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [captchaId]); // 依赖 captchaId

    const initializeGeetest = () => {
        console.log("Initializing Geetest with ID:", captchaId);
        window.initGeetest4({
            captchaId: captchaId,
            product: 'bind', // 使用 bind 模式，手动触发显示
            timeout: 5000, // 设置超时时间
        }, (captcha) => {
            console.log("Geetest instance created:", captcha);
            captchaRef.current = captcha;

            captcha.onReady(() => {
                console.log("Geetest ready");
                setIsCaptchaReady(true);
            });

            captcha.onSuccess(() => {
                console.log("Geetest success");
                const result = captcha.getValidate();
                if (!result) {
                    console.error("Geetest validation failed: result is empty");
                    // message.error('人机验证失败，请重试'); // 移除
                    const error = new Error('Geetest validation failed: result is empty');
                    if (promiseActionsRef.current) {
                        promiseActionsRef.current.reject(error);
                    }
                    options?.onError?.(error);
                } else {
                    const geetestResult: GeetestResult = {
                        lot_number: result.lot_number,
                        captcha_output: result.captcha_output,
                        pass_token: result.pass_token,
                        gen_time: result.gen_time,
                        captcha_id: captchaId, // 确保包含 captcha_id
                    };
                    console.log("Geetest result:", geetestResult);
                    if (promiseActionsRef.current) {
                        promiseActionsRef.current.resolve(geetestResult);
                    }
                    options?.onSuccess?.(geetestResult);
                }
                setIsCaptchaVisible(false); // 成功后隐藏
                promiseActionsRef.current = null; // 清理
            });

            captcha.onError((error: any) => {
                console.error("Geetest error:", error);
                // message.error(`人机验证出错: ${error?.msg || '未知错误'}`); // 移除
                captcha.reset?.(); // 尝试调用 reset
                if (promiseActionsRef.current) {
                    promiseActionsRef.current.reject(error);
                }
                options?.onError?.(error);
                setIsCaptchaVisible(false); // 出错时隐藏
                promiseActionsRef.current = null; // 清理
            });

            captcha.onClose(() => {
                console.log("Geetest closed");
                if (promiseActionsRef.current) {
                    // 只有在用户主动关闭且未成功/失败时才 reject
                    promiseActionsRef.current.reject(new Error('Captcha closed by user'));
                }
                options?.onClose?.();
                setIsCaptchaVisible(false); // 关闭时隐藏
                promiseActionsRef.current = null; // 清理
            });
        });
    };


    // 触发验证码显示的函数，返回一个 Promise
    const triggerCaptcha = useCallback((): Promise<GeetestResult> => {
        return new Promise((resolve, reject) => {
            if (!isCaptchaReady || !captchaRef.current) {
                console.error("Captcha not ready or instance not available.");
                // message.error("人机验证尚未准备好，请稍后重试"); // 移除
                reject(new Error("Captcha not ready"));
                return;
            }

            // 存储 resolve 和 reject 以便在回调中使用
            promiseActionsRef.current = { resolve, reject };

            try {
                console.log("Showing Geetest captcha box");
                captchaRef.current.showBox();
                setIsCaptchaVisible(true);
            } catch (error) {
                console.error("Failed to show Geetest captcha:", error);
                // message.error("无法显示人机验证"); // 移除
                reject(error);
                promiseActionsRef.current = null; // 清理
            }
        });
    }, [isCaptchaReady]); // 依赖 isCaptchaReady

    return { triggerCaptcha, isCaptchaReady, isCaptchaVisible };
};
