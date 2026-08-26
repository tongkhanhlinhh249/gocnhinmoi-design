/**
 * Cấu hình Tailwind cho Góc Nhìn Mới — dựng lại từ CSS đang chạy trên
 * cdn.gocnhinmoi.com/_next/static/css/4192e77be9801c9a.css
 *
 * Thang màu primary lấy nguyên từ file đó, không đặt lại: primary-800 (#B80001)
 * là màu thương hiệu đang dùng cho nút và link, primary-950 (#520000) là đáy
 * gradient của khối đỏ. Nhờ vậy markup của bản prototype dán thẳng sang Next.js
 * là ra đúng màu, không phải dò lại.
 */
module.exports = {
  content: ['./*.html', './assets/js/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FFEFEF',
          100: '#FFDCDC',
          200: '#FFBFBF',
          300: '#FF9293',
          400: '#FF5455',
          500: '#FF1F20',
          600: '#FF0001',
          700: '#DB0001',
          800: '#B80001',   // màu thương hiệu
          900: '#940809',
          950: '#520000',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          strong:  '#101828',
          muted:   '#8E8E93',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft:    '#FAFAFA',
          fill:    '#F3F4F6',
          dark:    '#101828',
        },
        line: {
          DEFAULT: '#ECECEC',
          2: '#E7E7E8',
          3: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-notosans)', 'Noto Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DFVN Mighty Wings', 'var(--font-notosans)', 'sans-serif'],
      },
      screens: {
        xs: '480px',
      },
      borderRadius: {
        card: '4px',
      },
      maxWidth: {
        shell: '480px',
      },
      boxShadow: {
        card:   '0 1px 2px 0 rgba(16,24,40,.06), 0 6px 12px -4px rgba(16,24,40,.12)',
        panel:  '0 1px 1px rgba(16,24,40,.06), 0 4px 4px rgba(16,24,40,.12)',
        header: '0 1px 1.5px rgba(0,0,0,.06)',
        badge:  '0 1px 1.5px rgba(0,0,0,.1), 0 1px 1px rgba(0,0,0,.1)',
      },
    },
  },
  plugins: [],
}
