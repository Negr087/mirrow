import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  useSeoMeta({
    title: 'Instagram ⇄ Nostr Mirror Bot',
    description: 'Bridge your social worlds. Automatically replicate public Instagram posts to your dedicated Nostr account with seamless NIP-96 integration.',
  });

  const features = [
    {
      icon: Sparkles,
      title: 'Automated Sync',
      description: 'Set it and forget it. Your Instagram posts flow effortlessly to Nostr.',
    },
    {
      icon: Camera,
      title: 'NIP-96 Uploads',
      description: 'Images are securely hosted on Nostr-compatible NIP-96 servers.',
    },
    {
      icon: Shield,
      title: 'Duplicate Prevention',
      description: 'Smart detection ensures only new posts are published, avoiding clutter.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="text-white">Instagram</span>
            <span className="mx-4 text-blue-400">⇄</span>
            <span className="text-white">Nostr</span>
            <div className="mt-2 text-4xl md:text-6xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Mirror Bot
            </div>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Bridge your social worlds. Automatically replicate public Instagram posts
            —images, text, and links—to your dedicated Nostr account with seamless
            NIP-96 integration.
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => navigate('/bot-config')}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Get Started Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                    <feature.icon className="w-12 h-12 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500">
            Vibed with{' '}
            <a
              href="https://shakespeare.wtf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Shakespeare
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;