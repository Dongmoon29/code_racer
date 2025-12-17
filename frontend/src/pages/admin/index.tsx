import Link from 'next/link';

export default function AdminPage() {
  const adminFeatures = [
    {
      title: 'Problem Management',
      description: 'Add new coding problems and edit/delete existing ones.',
      href: '/admin/problems',
      icon: '📝',
    },
    {
      title: 'User Management',
      description: 'Manage user permissions and monitor accounts.',
      href: '/admin/users',
      icon: '👥',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {adminFeatures.map((feature) => (
        <Link
          key={feature.href}
          href={feature.href}
          className="block group hover:-translate-y-2 transition-transform duration-200 h-full"
        >
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
            </div>
            <p className="mb-4">{feature.description}</p>
            <div className="flex items-center mt-auto">
              <span className="text-sm font-medium">Manage</span>
              <svg
                className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
