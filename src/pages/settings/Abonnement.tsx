import { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { supabase } from '../../lib/supabase';
import { Crown, CheckCircle2 } from 'lucide-react';

export function Abonnement() {
  const { subscription, refreshFamily } = useFamily();
  const [planChanging, setPlanChanging] = useState(false);

  const handlePlanChange = async (newPlan: 'FREE' | 'PLUS' | 'PRO') => {
    if (!subscription) return;

    setPlanChanging(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan: newPlan })
        .eq('id', subscription.id);

      if (error) throw error;

      if (refreshFamily) {
        await refreshFamily();
      }
    } catch (err) {
      console.error('Failed to update plan:', err);
      alert('Er is een fout opgetreden bij het wijzigen van je abonnement');
    } finally {
      setPlanChanging(false);
    }
  };

  const plans = [
    {
      name: 'FREE' as const,
      title: 'Gratis',
      price: '€0',
      features: [
        'Basis functionaliteit',
        'Tot 2 kinderen',
        'Beperkte opslag',
        'Basis ondersteuning',
      ],
    },
    {
      name: 'PLUS' as const,
      title: 'Plus',
      price: '€4,99/maand',
      features: [
        'Alle basis functies',
        'Onbeperkt kinderen',
        'Extra opslag (5GB)',
        'Prioriteit support',
        'Export functie',
        'Hulpverlener toegang',
      ],
    },
    {
      name: 'PRO' as const,
      title: 'Pro',
      price: '€9,99/maand',
      features: [
        'Alle Plus functies',
        'Onbeperkte opslag',
        'Geavanceerde exports',
        'Premium support',
        'Volledige geschiedenis',
        'API toegang',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonnement</h1>
        <p className="text-gray-600">Kies het plan dat bij jullie past</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isActive = subscription?.plan === plan.name;
          return (
            <div
              key={plan.name}
              className={`relative rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
              }`}
            >
              {isActive && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    Actief plan
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <h3 className="text-2xl font-bold text-gray-900">{plan.title}</h3>
                  </div>
                  {isActive && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">{plan.price}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanChange(plan.name)}
                  disabled={planChanging || isActive}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isActive ? 'Huidig plan' : planChanging ? 'Wijzigen...' : 'Kies dit plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Belangrijk om te weten</h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Het abonnement geldt voor het hele gezin. Als je het pakket wijzigt, heeft dit
              effect op alle gekoppelde ouders.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Je kunt op elk moment upgraden of downgraden. Bij een upgrade zijn de extra functies
              direct beschikbaar.
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Bij downgrade blijven je gegevens bewaard, maar sommige functies worden beperkt.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
