import { Link } from 'react-router-dom';
import { Crown, Link as LinkIcon, Bell, ChevronRight, UserCircle } from 'lucide-react';

export function Instellingen() {
  const menuItems = [
    {
      icon: UserCircle,
      title: 'Account',
      description: 'Beheer je persoonlijke gegevens, email en wachtwoord',
      link: '/instellingen/account',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
    },
    {
      icon: LinkIcon,
      title: 'Koppelen met co-ouder',
      description: 'Beheer je koppeling met je co-ouder en kindvisibiliteit',
      link: '/instellingen/koppelen',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Crown,
      title: 'Abonnement',
      description: 'Beheer je abonnement en bekijk beschikbare functies',
      link: '/instellingen/abonnement',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: Bell,
      title: 'Meldingen',
      description: 'Pas je notificatie voorkeuren aan',
      link: '/instellingen/meldingen',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instellingen</h1>
        <p className="text-gray-600">Beheer je account en familieinstellingen</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.link}
              to={item.link}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h2>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
