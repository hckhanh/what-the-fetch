import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/hckhanh/afetch',
    nav: {
      title: (
        <span>
          🔗<span className='ml-2'>afetch</span>
        </span>
      ),
      url: '/docs',
    },
  }
}
