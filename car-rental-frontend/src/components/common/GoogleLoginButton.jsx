import { useEffect, useRef } from 'react'

/**
 * GoogleLoginButton
 * Dùng Google Identity Services (GSI) để render nút "Đăng nhập bằng Google".
 * Khi user chọn tài khoản, Google trả về credential (id_token) → gọi onSuccess(idToken).
 *
 * Props:
 *  - onSuccess(idToken: string): callback khi đăng nhập Google thành công
 *  - onError(): callback khi thất bại (optional)
 *  - text: 'signin_with' | 'signup_with' | 'continue_with' (default: 'signin_with')
 */
export default function GoogleLoginButton({ onSuccess, onError, text = 'signin_with' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('[GoogleLoginButton] VITE_GOOGLE_CLIENT_ID chưa được cấu hình!')
      return
    }

    // Load Google GSI script nếu chưa có
    const loadScript = () => {
      return new Promise((resolve) => {
        if (window.google?.accounts) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = resolve
        document.head.appendChild(script)
      })
    }

    const initGoogle = async () => {
      await loadScript()

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential)
          } else {
            onError?.()
          }
        },
      })

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: containerRef.current?.offsetWidth || 340,
      })
    }

    initGoogle()

    return () => {
      // Cleanup: cancel pending prompt if any
      window.google?.accounts?.id?.cancel?.()
    }
  }, [onSuccess, onError, text])

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center"
      style={{ minHeight: 44 }}
    />
  )
}
