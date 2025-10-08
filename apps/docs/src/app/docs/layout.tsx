import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.pageTree}
      sidebar={{
        tabs: {
          transform(option, node) {
            const meta = source.getNodeMeta(node);
            if (!meta || !node.icon) return option;

            return {
              ...option,
              icon: (
                <div className="rounded-lg size-full flex items-center justify-center">
                  {node.icon}
                </div>
              ),
            };
          },
        },
      }}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  );
}
