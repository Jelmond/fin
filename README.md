
# Next.js 14 Starter with Three.js and Animation Features

This Next.js 14 starter project provides an advanced setup with built-in Three.js, a variety of animation components, and a highly configurable layout system. It is designed to optimize animations, smooth scrolling, and user interactivity while maintaining seamless performance.

## Finance + Task Tracker (Supabase)

The home page ships with a personal tracker (UI in Russian) for:
- Tasks with optional deadlines, bonuses, and penalties.
- Financial entries (income/expense).
- Separate tables for bonuses and penalties that roll into your net balance.

### Supabase setup
1) In Supabase, create these tables (SQL):
```
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  due_date timestamptz,
  reward numeric,
  penalty numeric,
  status text default 'pending',
  notes text
);

create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  occurred_on date not null,
  amount numeric not null,
  category text not null check (category in ('income','expense')),
  description text,
  task_id uuid references tasks(id)
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists finance_entry_tags (
  id uuid primary key default gen_random_uuid(),
  finance_entry_id uuid not null references finance_entries(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz default now(),
  unique(finance_entry_id, tag_id)
);

create table if not exists bonuses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  task_id uuid references tasks(id),
  reason text
);

create table if not exists penalties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  task_id uuid references tasks(id),
  reason text
);

create table if not exists finance_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  occurred_on date not null,
  kind text not null check (kind in ('income','expense','bonus','penalty')),
  amount numeric not null,
  description text,
  task_id uuid references tasks(id)
);

create table if not exists finance_state (
  id text primary key,
  balance numeric not null default 0,
  income_total numeric not null default 0,
  expense_total numeric not null default 0,
  bonuses_total numeric not null default 0,
  penalties_total numeric not null default 0,
  updated_at timestamptz default now()
);

insert into finance_state (id) values ('current')
on conflict (id) do nothing;
```

**Migration for existing databases:**

If you already have the database set up, run these migration SQL commands in Supabase:

```sql
-- Remove amount column from bonuses table
ALTER TABLE bonuses DROP COLUMN IF EXISTS amount;

-- Remove amount column from penalties table
ALTER TABLE penalties DROP COLUMN IF EXISTS amount;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS finance_entry_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_entry_id uuid NOT NULL REFERENCES finance_entries(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(finance_entry_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_entry_tags_entry_id ON finance_entry_tags(finance_entry_id);
CREATE INDEX IF NOT EXISTS idx_finance_entry_tags_tag_id ON finance_entry_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
```

2) Add environment variables to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3) Restart `yarn dev`. The dashboard will read/write to your Supabase project. If env vars are missing you will see a warning card in the UI.

---

![Hero Image](./public/open-graph.png)

## Key Features

- **Three.js Integration with Tunnel**: Persist your Three.js scenes across pages for a seamless experience.
- **Lenis Smooth Scroll**: Enhances scrolling performance with buttery-smooth animations.
- **Animated Loader Layout**: Tracks page loading states and plays animations during transitions.
- **Animated Router Layout**: Provides `AnimLink` and `useAnimRouter` for managing animated page transitions.
- **Built-In Animation Components**:
  - **Spring**: General-purpose animation wrapper.
  - **Inview**: Trigger animations when an element enters the viewport.
  - **SpringTrigger**: Enables scroll-based animations.
  - **Hover**: Animates elements on hover.
- **FrameByFrame Component**: Optimized, lazy-loaded frame-by-frame animations for scroll or drag interactions.
- **TextEngine**: Easily create smooth and complex text animations.
- **SkeletonImage & SkeletonVideo**: Placeholder components for images and videos with skeleton loaders.
- **Styled Components System**: Fully responsive, styled-components-based grid system.

---

## Utilities

- `debounce`: Utility to control the rate of function execution.
- `generateMetadata`: Helper to dynamically generate metadata.
- `lerp`: Linear interpolation for smooth transitions.
- `scrollTo`: Enhanced scroll function compatible with Lenis smooth scrolling.

---

## Hooks

The project includes a set of useful hooks to improve productivity:

- `useDynamicInView`
- `useInViewRef`
- `useLoop`
- `useLoopInView`
- `useResizeLoop`
- `useSpringTrigger`
- `useWindowSize`

---

## Examples

### Animation with `Hover` Component
```tsx
import { Hover } from "@/components/Springs/Hover";

const HoverExample = () => {
  return (
    <Hover
      tag="div"
      from={{ scale: 1 }}
      to={{ scale: 1.2 }}
      style={{ backgroundColor: "lightblue", padding: "20px" }}
    >
      Hover over me!
    </Hover>
  );
};
```

### Animation with `Spring` Component
use like `useSpring` to animate any element, provide reactive state to enable props to be animated
```tsx
import { Spring } from "@/components/Springs/Spring";

const SpringExample = () => {
  return (
    <Spring
      tag="div"
      from={{ scale: 1 }}
      to={{ scale: 1.2 }}
      enabled={true}
    >
      <div>I scale in if enabled is true!</div>
    </Spring>
  );
};
```

### Animation with `Inview` Component
```tsx
import { Inview } from "@/components/Springs/Inview";

const InviewExample = () => {
  return (
    <Inview
      tag="div"
      from={{ scale: 1 }}
      to={{ scale: 1.2 }}
      style={{ backgroundColor: "lightblue", padding: "20px" }}
    >
      I fade in if visible!
    </Inview>
  );
};
```


### Scroll-Based Animation with `SpringTrigger`
```tsx
import { SpringTrigger } from "@/components/Springs/Springtrigger";

const ScrollExample = () => {
  return (
    <SpringTrigger
      tag="div"
      from={{ opacity: 0 }}
      to={{ opacity: 1 }}
      start="top top"
      end="bottom bottom"
    >
      I fade in on scroll!
    </SpringTrigger>
  );
};
```

### Text Animation with `TextEngine`
```tsx
export const TLine: NextPage<Props & EngineProps> = memo(({
    children,
    enabled = true,
    ...props
}) => {
    const { fullyLoaded } = useAssetsLoader()
    const isRerouting = useIsRerouting()
    return (
        <TextEngine
            enabled={fullyLoaded && !isRerouting && enabled}
            lineIn={{y: 0, opacity: 1}}
            lineOut={{y: 100, opacity: 0}}
            lineStagger={80}
            lineConfig={{ duration: 1200, easing: easings.easeOutCubic }}
            overflow
            showSeoText={false}
            seo={true}
            columnGap={0.6}
            {...props}
        >
            { children }
        </TextEngine>
    )
})
```

---

## How to Use

1. Clone the repository and install dependencies:
   ```bash
   git clone [repo_url]
   cd [repo_name]
   yarn
   ```

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Customize your project with the built-in components and utilities.

---

## Directory Structure

- **components/**: Contains animation and utility components like `Spring`, `Hover`, `Inview`, `TextEngine`, etc.
- **hooks/**: Reusable custom hooks for animations and interactions.
- **layouts/**: Layouts for animated transitions, loaders, and asset management.
- **styles/**: Global and styled-components-based styling.
- **utils/**: Utility functions like `debounce`, `lerp`, and `scrollTo`.

---

## License

This project is licensed under the MIT License. Feel free to use and modify it
# fin
