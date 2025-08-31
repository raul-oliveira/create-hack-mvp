import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create or update profile from auth user data
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        firstName: user.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        email: user.email || ''
      },
      create: {
        id: user.id,
        firstName: user.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        email: user.email || ''
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      }
    });

  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
