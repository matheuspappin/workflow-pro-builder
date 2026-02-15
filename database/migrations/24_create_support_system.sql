-- 24_create_support_system.sql

-- Create Enum Types if supported, otherwise check constraints
-- Using check constraints for portability

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL, -- Nullable for partners/global users
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'resolved')),
  priority VARCHAR(20) DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(50) DEFAULT 'general',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if system message
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_support_tickets_studio ON support_tickets(studio_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets

-- 1. Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    (studio_id IS NOT NULL AND studio_id IN (
      SELECT studio_id FROM users_internal WHERE id = auth.uid() AND role IN ('admin', 'owner')
    ))
  );

-- 2. Admins (Super Admins) can view all tickets
-- Assuming we have a way to identify super admins. 
-- For now, let's assume specific users or checking public.users table if it exists, 
-- but often RLS for super admins is handled by bypassing RLS or checking a claim.
-- If we check the schema, we don't have a clear "is_super_admin" flag on auth.users directly usually, 
-- but maybe in `users_internal` with role='super_admin' and studio_id IS NULL or specific logic.
-- Let's check `users_internal` role.

CREATE POLICY "Super Admins can view all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_internal 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 3. Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- 4. Users can update their own tickets (e.g. close them)
CREATE POLICY "Users can update own tickets" ON support_tickets
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR 
    (studio_id IS NOT NULL AND studio_id IN (
      SELECT studio_id FROM users_internal WHERE id = auth.uid() AND role IN ('admin', 'owner')
    ))
  );

-- Policies for support_messages

-- 1. Users can view messages for tickets they have access to
CREATE POLICY "Users can view messages for accessible tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = ticket_id 
      AND (
        support_tickets.user_id = auth.uid()
        OR
        (support_tickets.studio_id IS NOT NULL AND support_tickets.studio_id IN (
          SELECT studio_id FROM users_internal WHERE id = auth.uid() AND role IN ('admin', 'owner')
        ))
        OR
        EXISTS (
            SELECT 1 FROM users_internal 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
      )
    )
  );

-- 2. Users can insert messages to tickets they have access to
CREATE POLICY "Users can add messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = ticket_id 
      AND (
        support_tickets.user_id = auth.uid()
        OR
        (support_tickets.studio_id IS NOT NULL AND support_tickets.studio_id IN (
          SELECT studio_id FROM users_internal WHERE id = auth.uid() AND role IN ('admin', 'owner')
        ))
        OR
        EXISTS (
            SELECT 1 FROM users_internal 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
      )
    )
  );
