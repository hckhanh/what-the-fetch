import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/hckhanh/what-the-fetch',
    nav: {
      title: (
        <span>
          🌐<span className='ml-2'>what-the-fetch</span>
        </span>
      ),
      url: '/docs',
    },
  }
}
