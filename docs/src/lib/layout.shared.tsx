import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/hckhanh/fast-url',
    nav: {
      title: (
        <span>
          🔗<span className='ml-2'>fast-url</span>
        </span>
      ),
      url: '/docs',
    },
  }
}
