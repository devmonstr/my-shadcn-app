import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  try {
    if (name) {
      // ค้นหาผู้ใช้ตาม username
      const { data } = await supabase
        .from('registered_users')
        .select('username, public_key, relays')
        .eq('username', name);

      if (!data || data.length === 0) {
        return NextResponse.json({}, { status: 404 });
      }

      const user = data[0];
      const response: {
        names: Record<string, string>;
        relays?: Record<string, string[]>;
      } = {
        names: {
          [user.username]: user.public_key,
        },
      };

      // รวม relays ถ้ามี
      if (user.relays && Array.isArray(user.relays)) {
        response.relays = {
          [user.public_key]: user.relays.filter((relay: string) => relay && typeof relay === 'string'),
        };
      }

      return NextResponse.json(response);
    } else {
      // ส่งคืนข้อมูลทั้งหมด
      const { data } = await supabase
        .from('registered_users')
        .select('username, public_key, relays');

      if (!data) {
        return NextResponse.json({}, { status: 500 });
      }

      const response: {
        names: Record<string, string>;
        relays: Record<string, string[]>;
      } = {
        names: {},
        relays: {},
      };

      for (const user of data) {
        response.names[user.username] = user.public_key;
        if (user.relays && Array.isArray(user.relays)) {
          response.relays[user.public_key] = user.relays.filter((relay: string) => relay && typeof relay === 'string');
        }
      }

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error fetching NIP-05 data:', error);
    return NextResponse.json({}, { status: 500 });
  }
}