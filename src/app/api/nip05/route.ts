import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json(
      { error: 'Name parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Query Supabase for the mapping
    const { data, error } = await supabase
      .from('registered_users')
      .select('public_key')
      .eq('username', name)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'NIP-05 address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      names: {
        [name]: data.public_key
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { username, publicKey } = await request.json();

    if (!username || !publicKey) {
      return NextResponse.json(
        { error: 'Username and public key are required' },
        { status: 400 }
      );
    }

    // Validate public key format
    if (!/^[0-9a-f]{64}$/.test(publicKey)) {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      );
    }

    // Check for duplicate username
    const { data: existingUser } = await supabase
      .from('registered_users')
      .select('username')
      .eq('username', username);

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check for duplicate public key
    const { data: existingKey } = await supabase
      .from('registered_users')
      .select('public_key')
      .eq('public_key', publicKey);

    if (existingKey && existingKey.length > 0) {
      return NextResponse.json(
        { error: 'Public key already registered' },
        { status: 409 }
      );
    }

    // Save to Supabase
    const { error: insertError } = await supabase
      .from('registered_users')
      .insert({ username, public_key: publicKey });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save NIP-05 address' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      names: {
        [username]: publicKey
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 