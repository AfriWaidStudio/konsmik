export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      being_hires: {
        Row: {
          amount: number
          being_id: string
          created_at: string
          hirer_id: string
          id: string
          note: string | null
          owner_id: string
        }
        Insert: {
          amount?: number
          being_id: string
          created_at?: string
          hirer_id: string
          id?: string
          note?: string | null
          owner_id: string
        }
        Update: {
          amount?: number
          being_id?: string
          created_at?: string
          hirer_id?: string
          id?: string
          note?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_hires_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_hires_hirer_id_fkey"
            columns: ["hirer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_hires_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      being_memories: {
        Row: {
          being_id: string
          content: string
          created_at: string
          id: string
          label: string
          owner_id: string
        }
        Insert: {
          being_id: string
          content: string
          created_at?: string
          id?: string
          label: string
          owner_id: string
        }
        Update: {
          being_id?: string
          content?: string
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_memories_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
        ]
      }
      being_messages: {
        Row: {
          being_id: string
          content: string
          created_at: string
          id: string
          role: string
          tred_id: string | null
          user_id: string
        }
        Insert: {
          being_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          tred_id?: string | null
          user_id: string
        }
        Update: {
          being_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          tred_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_messages_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_messages_tred_id_fkey"
            columns: ["tred_id"]
            isOneToOne: false
            referencedRelation: "tred_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      being_missions: {
        Row: {
          being_id: string
          brief: string
          completed_at: string | null
          created_at: string
          id: string
          model: string | null
          owner_id: string
          result: string | null
          status: string
          title: string
          tred_id: string | null
          updated_at: string
        }
        Insert: {
          being_id: string
          brief: string
          completed_at?: string | null
          created_at?: string
          id?: string
          model?: string | null
          owner_id: string
          result?: string | null
          status?: string
          title: string
          tred_id?: string | null
          updated_at?: string
        }
        Update: {
          being_id?: string
          brief?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          model?: string | null
          owner_id?: string
          result?: string | null
          status?: string
          title?: string
          tred_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_missions_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_missions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_missions_tred_id_fkey"
            columns: ["tred_id"]
            isOneToOne: false
            referencedRelation: "tred_beings"
            referencedColumns: ["id"]
          },
        ]
      }
      being_reviews: {
        Row: {
          being_id: string
          body: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          being_id: string
          body?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          being_id?: string
          body?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_reviews_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
        ]
      }
      being_schedules: {
        Row: {
          active: boolean
          being_id: string
          brief: string
          cadence: string
          created_at: string
          id: string
          label: string
          next_run_at: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          being_id: string
          brief: string
          cadence?: string
          created_at?: string
          id?: string
          label: string
          next_run_at?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          being_id?: string
          brief?: string
          cadence?: string
          created_at?: string
          id?: string
          label?: string
          next_run_at?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_schedules_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
        ]
      }
      being_team_members: {
        Row: {
          being_id: string
          created_at: string
          duty: string | null
          team_id: string
        }
        Insert: {
          being_id: string
          created_at?: string
          duty?: string | null
          team_id: string
        }
        Update: {
          being_id?: string
          created_at?: string
          duty?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "being_team_members_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "being_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "being_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      being_teams: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          post_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          post_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_boosts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_matches: {
        Row: {
          created_at: string
          id: string
          thread_id: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_matches_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_profiles: {
        Row: {
          active: boolean
          age: number | null
          bio: string | null
          birthdate: string | null
          created_at: string
          gender: string
          interested_in: string[]
          interests: string[]
          location: string | null
          looking_for: string
          max_age: number
          min_age: number
          photos: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          age?: number | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          gender?: string
          interested_in?: string[]
          interests?: string[]
          location?: string | null
          looking_for?: string
          max_age?: number
          min_age?: number
          photos?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          age?: number | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          gender?: string
          interested_in?: string[]
          interests?: string[]
          location?: string | null
          looking_for?: string
          max_age?: number
          min_age?: number
          photos?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_prompts: {
        Row: {
          answer: string
          created_at: string
          id: string
          position: number
          prompt: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          position?: number
          prompt: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          position?: number
          prompt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_swipes: {
        Row: {
          action: string
          created_at: string
          from_user: string
          id: string
          to_user: string
        }
        Insert: {
          action?: string
          created_at?: string
          from_user: string
          id?: string
          to_user: string
        }
        Update: {
          action?: string
          created_at?: string
          from_user?: string
          id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_swipes_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_members: {
        Row: {
          joined_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          duration_ms: number | null
          id: string
          media_type: string | null
          media_url: string | null
          reply_to: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_pins: {
        Row: {
          created_at: string
          message_id: string
          pinned_by: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          pinned_by: string
          thread_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          pinned_by?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_pins_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_pins_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_thread_settings: {
        Row: {
          muted: boolean
          nickname: string | null
          theme: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          muted?: boolean
          nickname?: string | null
          theme?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          muted?: boolean
          nickname?: string | null
          theme?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_thread_settings_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          body: string
          id: string
          kind: string
          payload: Json
          target_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          id?: string
          kind: string
          payload?: Json
          target_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          kind?: string
          payload?: Json
          target_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          source_id: string
          source_type: string
          target_id: string | null
          target_text: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          source_id: string
          source_type: string
          target_id?: string | null
          target_text?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          source_id?: string
          source_type?: string
          target_id?: string | null
          target_text?: string | null
          target_type?: string
        }
        Relationships: []
      }
      feed_prefs: {
        Row: {
          hide_reposts: boolean
          muted_words: string[]
          sort: string
          updated_at: string
          user_id: string
        }
        Insert: {
          hide_reposts?: boolean
          muted_words?: string[]
          sort?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          hide_reposts?: boolean
          muted_words?: string[]
          sort?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followed_tags: {
        Row: {
          created_at: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followed_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hides: {
        Row: {
          created_at: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      human_proofs: {
        Row: {
          method: string
          score: number
          user_id: string
          verified_at: string
        }
        Insert: {
          method: string
          score?: number
          user_id: string
          verified_at?: string
        }
        Update: {
          method?: string
          score?: number
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maiki_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          counterparty: string | null
          created_at: string
          id: string
          kind: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          counterparty?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          counterparty?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maiki_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maiki_wallets: {
        Row: {
          address: string
          balance: number
          created_at: string
          locked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          balance?: number
          created_at?: string
          locked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          balance?: number
          created_at?: string
          locked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maiki_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          by_user_id: string
          comment_id: string | null
          created_at: string
          id: string
          mentioned_user_id: string
          post_id: string | null
        }
        Insert: {
          by_user_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id: string
          post_id?: string | null
        }
        Update: {
          by_user_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id?: string
          post_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_templates: {
        Row: {
          brief: string
          category: string
          created_at: string
          id: string
          is_public: boolean
          owner_id: string
          title: string
          uses: number
        }
        Insert: {
          brief: string
          category?: string
          created_at?: string
          id?: string
          is_public?: boolean
          owner_id: string
          title: string
          uses?: number
        }
        Update: {
          brief?: string
          category?: string
          created_at?: string
          id?: string
          is_public?: boolean
          owner_id?: string
          title?: string
          uses?: number
        }
        Relationships: []
      }
      mutes: {
        Row: {
          created_at: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          muted_id?: string
          muter_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          priority: Database["public"]["Enums"]["notification_priority"]
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          id: string
          label: string
          poll_id: string
          position: number
        }
        Insert: {
          id?: string
          label: string
          poll_id: string
          position?: number
        }
        Update: {
          id?: string
          label?: string
          poll_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          created_at: string
          id: string
          multi_select: boolean
          post_id: string
          question: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          id?: string
          multi_select?: boolean
          post_id: string
          question: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          id?: string
          multi_select?: boolean
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_collaborators: {
        Row: {
          created_at: string
          post_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_collaborators_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_context: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          model: string | null
          post_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          model?: string | null
          post_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          model?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_context_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_edit_history: {
        Row: {
          body: string
          created_at: string
          editor_id: string
          id: string
          post_id: string
        }
        Insert: {
          body: string
          created_at?: string
          editor_id: string
          id?: string
          post_id: string
        }
        Update: {
          body?: string
          created_at?: string
          editor_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_edit_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_targets: {
        Row: {
          created_at: string
          id: string
          post_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_targets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tips: {
        Row: {
          amount: number
          created_at: string
          from_user: string
          id: string
          post_id: string
          to_user: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user: string
          id?: string
          post_id: string
          to_user: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user?: string
          id?: string
          post_id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          audience: string
          author_id: string
          body: string
          category: string | null
          channel_id: string | null
          community: Database["public"]["Enums"]["community_kind"]
          created_at: string
          edited_at: string | null
          expire_at: string | null
          hashtags: string[]
          id: string
          is_announcement: boolean
          media_url: string | null
          pinned: boolean
          repost_of: string | null
          scheduled_at: string | null
          space_id: string | null
          tokens: number
          trending: boolean
          type: Database["public"]["Enums"]["post_type"]
          unlock_at: string | null
          views: number
        }
        Insert: {
          audience?: string
          author_id: string
          body: string
          category?: string | null
          channel_id?: string | null
          community?: Database["public"]["Enums"]["community_kind"]
          created_at?: string
          edited_at?: string | null
          expire_at?: string | null
          hashtags?: string[]
          id?: string
          is_announcement?: boolean
          media_url?: string | null
          pinned?: boolean
          repost_of?: string | null
          scheduled_at?: string | null
          space_id?: string | null
          tokens?: number
          trending?: boolean
          type?: Database["public"]["Enums"]["post_type"]
          unlock_at?: string | null
          views?: number
        }
        Update: {
          audience?: string
          author_id?: string
          body?: string
          category?: string | null
          channel_id?: string | null
          community?: Database["public"]["Enums"]["community_kind"]
          created_at?: string
          edited_at?: string | null
          expire_at?: string | null
          hashtags?: string[]
          id?: string
          is_announcement?: boolean
          media_url?: string | null
          pinned?: boolean
          repost_of?: string | null
          scheduled_at?: string | null
          space_id?: string | null
          tokens?: number
          trending?: boolean
          type?: Database["public"]["Enums"]["post_type"]
          unlock_at?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "space_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_fkey"
            columns: ["repost_of"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          id: string
          interests: string[]
          is_private: boolean
          last_seen_at: string | null
          location: string | null
          onboarded: boolean
          reputation: number
          title: string | null
          tokens_earned: number
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          id: string
          interests?: string[]
          is_private?: boolean
          last_seen_at?: string | null
          location?: string | null
          onboarded?: boolean
          reputation?: number
          title?: string | null
          tokens_earned?: number
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[]
          is_private?: boolean
          last_seen_at?: string | null
          location?: string | null
          onboarded?: boolean
          reputation?: number
          title?: string | null
          tokens_earned?: number
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          quote_post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          quote_post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          quote_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_quote_post_id_fkey"
            columns: ["quote_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          points: number
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          points?: number
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          points?: number
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_splits: {
        Row: {
          created_at: string
          id: string
          percent: number
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percent: number
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percent?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_splits_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_terms: {
        Row: {
          created_at: string
          id: string
          term: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          term: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          term?: string
          user_id?: string | null
        }
        Relationships: []
      }
      smai_beings: {
        Row: {
          accent: string
          avatar_url: string | null
          created_at: string
          hire_rate: number
          id: string
          is_public: boolean
          kind: string
          model: string
          name: string
          owner_id: string
          personality: string
          purpose: string | null
          role: string
          runs: number
          skills: string[]
          updated_at: string
        }
        Insert: {
          accent?: string
          avatar_url?: string | null
          created_at?: string
          hire_rate?: number
          id?: string
          is_public?: boolean
          kind?: string
          model?: string
          name: string
          owner_id: string
          personality?: string
          purpose?: string | null
          role?: string
          runs?: number
          skills?: string[]
          updated_at?: string
        }
        Update: {
          accent?: string
          avatar_url?: string | null
          created_at?: string
          hire_rate?: number
          id?: string
          is_public?: boolean
          kind?: string
          model?: string
          name?: string
          owner_id?: string
          personality?: string
          purpose?: string | null
          role?: string
          runs?: number
          skills?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smai_beings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smai_links: {
        Row: {
          created_at: string
          followers: number | null
          handle: string | null
          id: string
          platform: string
          sort_order: number
          url: string
          user_id: string
          verified: boolean
          visible: boolean
        }
        Insert: {
          created_at?: string
          followers?: number | null
          handle?: string | null
          id?: string
          platform: string
          sort_order?: number
          url: string
          user_id: string
          verified?: boolean
          visible?: boolean
        }
        Update: {
          created_at?: string
          followers?: number | null
          handle?: string | null
          id?: string
          platform?: string
          sort_order?: number
          url?: string
          user_id?: string
          verified?: boolean
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "smai_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smai_profiles: {
        Row: {
          about: string | null
          banner_url: string | null
          created_at: string
          headline: string | null
          hire_url: string | null
          is_public: boolean
          location: string | null
          niche_data: Json
          niches: string[]
          open_to: string[]
          pronouns: string | null
          rate_card: string | null
          skills: string[]
          tagline: string | null
          theme_color: string
          updated_at: string
          user_id: string
          verified: boolean
          views: number
          website: string | null
        }
        Insert: {
          about?: string | null
          banner_url?: string | null
          created_at?: string
          headline?: string | null
          hire_url?: string | null
          is_public?: boolean
          location?: string | null
          niche_data?: Json
          niches?: string[]
          open_to?: string[]
          pronouns?: string | null
          rate_card?: string | null
          skills?: string[]
          tagline?: string | null
          theme_color?: string
          updated_at?: string
          user_id: string
          verified?: boolean
          views?: number
          website?: string | null
        }
        Update: {
          about?: string | null
          banner_url?: string | null
          created_at?: string
          headline?: string | null
          hire_url?: string | null
          is_public?: boolean
          location?: string | null
          niche_data?: Json
          niches?: string[]
          open_to?: string[]
          pronouns?: string | null
          rate_card?: string | null
          skills?: string[]
          tagline?: string | null
          theme_color?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          views?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smai_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      space_album_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          id: string
          uploaded_by: string
          url: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          id?: string
          uploaded_by: string
          url: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_album_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "space_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      space_albums: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          id: string
          space_id: string
          title: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          space_id: string
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          space_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_albums_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          meta: Json
          space_id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          meta?: Json
          space_id: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          meta?: Json
          space_id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_audit_log_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_badges: {
        Row: {
          awarded_by: string
          badge: string
          created_at: string
          id: string
          space_id: string
          user_id: string
        }
        Insert: {
          awarded_by: string
          badge: string
          created_at?: string
          id?: string
          space_id: string
          user_id: string
        }
        Update: {
          awarded_by?: string
          badge?: string
          created_at?: string
          id?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_badges_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_bans: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          kind: string
          reason: string | null
          space_id: string
          until: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          kind?: string
          reason?: string | null
          space_id: string
          until?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          kind?: string
          reason?: string | null
          space_id?: string
          until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_bans_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          position: number
          slug: string
          space_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          position?: number
          slug: string
          space_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_channels_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "space_events"
            referencedColumns: ["id"]
          },
        ]
      }
      space_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          space_id: string
          start_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          space_id: string
          start_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          space_id?: string
          start_at?: string
          title?: string
        }
        Relationships: []
      }
      space_files: {
        Row: {
          created_at: string
          id: string
          mime: string | null
          pinned: boolean
          size_bytes: number | null
          space_id: string
          title: string
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime?: string | null
          pinned?: boolean
          size_bytes?: number | null
          space_id: string
          title: string
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          mime?: string | null
          pinned?: boolean
          size_bytes?: number | null
          space_id?: string
          title?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_files_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invite_links: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          space_id: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          space_id: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          space_id?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "space_invite_links_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_user_id: string
          responded_at: string | null
          space_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_user_id: string
          responded_at?: string | null
          space_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          responded_at?: string | null
          space_id?: string
          status?: string
        }
        Relationships: []
      }
      space_jobs: {
        Row: {
          apply_url: string | null
          closes_at: string | null
          compensation: string | null
          created_at: string
          description: string | null
          id: string
          job_type: string
          location: string | null
          posted_by: string
          space_id: string
          title: string
        }
        Insert: {
          apply_url?: string | null
          closes_at?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string
          location?: string | null
          posted_by: string
          space_id: string
          title: string
        }
        Update: {
          apply_url?: string | null
          closes_at?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string
          location?: string | null
          posted_by?: string
          space_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_jobs_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_join_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          question_id: string
          request_id: string
          space_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question_id: string
          request_id: string
          space_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question_id?: string
          request_id?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_join_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "space_membership_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_join_answers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "space_join_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_join_answers_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          space_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          space_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          space_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_join_requests_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["space_role"]
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["space_role"]
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["space_role"]
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_membership_questions: {
        Row: {
          created_at: string
          id: string
          position: number
          question: string
          required: boolean
          space_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          question: string
          required?: boolean
          space_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          question?: string
          required?: boolean
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_membership_questions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_notification_prefs: {
        Row: {
          comments: boolean
          events: boolean
          mentions: boolean
          milestones: boolean
          posts: boolean
          space_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: boolean
          events?: boolean
          mentions?: boolean
          milestones?: boolean
          posts?: boolean
          space_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: boolean
          events?: boolean
          mentions?: boolean
          milestones?: boolean
          posts?: boolean
          space_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_notification_prefs_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      space_pins: {
        Row: {
          created_at: string
          pinned_by: string
          post_id: string
          space_id: string
        }
        Insert: {
          created_at?: string
          pinned_by: string
          post_id: string
          space_id: string
        }
        Update: {
          created_at?: string
          pinned_by?: string
          post_id?: string
          space_id?: string
        }
        Relationships: []
      }
      space_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          rating: number
          space_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          rating: number
          space_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          rating?: number
          space_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      space_rules_accepts: {
        Row: {
          accepted_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_rules_accepts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price_label: string | null
          sort_order: number
          space_id: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_label?: string | null
          sort_order?: number
          space_id: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_label?: string | null
          sort_order?: number
          space_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_services_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_subscriptions: {
        Row: {
          expires_at: string | null
          id: string
          space_id: string
          started_at: string
          tier_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          space_id: string
          started_at?: string
          tier_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          space_id?: string
          started_at?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_subscriptions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "space_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      space_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string
          details: string | null
          due_at: string | null
          id: string
          space_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by: string
          details?: string | null
          due_at?: string | null
          id?: string
          space_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          details?: string | null
          due_at?: string | null
          id?: string
          space_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_tasks_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_tiers: {
        Row: {
          active: boolean
          benefits: string[]
          created_at: string
          description: string | null
          id: string
          name: string
          price_maiki: number
          space_id: string
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_maiki?: number
          space_id: string
        }
        Update: {
          active?: boolean
          benefits?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_maiki?: number
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_tiers_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_wiki_pages: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          slug: string
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by: string
          id?: string
          slug: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          slug?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_wiki_pages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          announcement: string | null
          avatar_url: string | null
          category: string | null
          community: Database["public"]["Enums"]["community_kind"]
          contact_email: string | null
          cover_url: string | null
          created_at: string
          cta_label: string | null
          cta_type: string | null
          cta_url: string | null
          description: string | null
          dm_thread_id: string | null
          id: string
          kind: Database["public"]["Enums"]["space_kind"]
          member_count: number
          name: string
          owner_id: string
          phone: string | null
          rules: string | null
          slug: string
          theme_color: string | null
          verified: boolean
          visibility: Database["public"]["Enums"]["space_visibility"]
          website: string | null
          welcome_message: string | null
        }
        Insert: {
          announcement?: string | null
          avatar_url?: string | null
          category?: string | null
          community?: Database["public"]["Enums"]["community_kind"]
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_type?: string | null
          cta_url?: string | null
          description?: string | null
          dm_thread_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["space_kind"]
          member_count?: number
          name: string
          owner_id: string
          phone?: string | null
          rules?: string | null
          slug: string
          theme_color?: string | null
          verified?: boolean
          visibility?: Database["public"]["Enums"]["space_visibility"]
          website?: string | null
          welcome_message?: string | null
        }
        Update: {
          announcement?: string | null
          avatar_url?: string | null
          category?: string | null
          community?: Database["public"]["Enums"]["community_kind"]
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_type?: string | null
          cta_url?: string | null
          description?: string | null
          dm_thread_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["space_kind"]
          member_count?: number
          name?: string
          owner_id?: string
          phone?: string | null
          rules?: string | null
          slug?: string
          theme_color?: string | null
          verified?: boolean
          visibility?: Database["public"]["Enums"]["space_visibility"]
          website?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      tred_beings: {
        Row: {
          active: boolean
          being_id: string
          created_at: string
          duty: string
          id: string
          instructions: string | null
          name: string
          owner_id: string
          runs: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          being_id: string
          created_at?: string
          duty: string
          id?: string
          instructions?: string | null
          name: string
          owner_id: string
          runs?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          being_id?: string
          created_at?: string
          duty?: string
          id?: string
          instructions?: string | null
          name?: string
          owner_id?: string
          runs?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tred_beings_being_id_fkey"
            columns: ["being_id"]
            isOneToOne: false
            referencedRelation: "smai_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tred_beings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_episodes: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_number: number
          id: string
          published_at: string
          season_number: number
          show_id: string
          thumbnail_url: string | null
          title: string
          video_url: string
          views: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number
          id?: string
          published_at?: string
          season_number?: number
          show_id: string
          thumbnail_url?: string | null
          title: string
          video_url: string
          views?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number
          id?: string
          published_at?: string
          season_number?: number
          show_id?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "tv_episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "tv_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_shows: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          slug: string
          studio: string
          title: string
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          slug: string
          studio?: string
          title: string
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          slug?: string
          studio?: string
          title?: string
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          discoverable: boolean
          dm_privacy: string
          notif_comments: boolean
          notif_follows: boolean
          notif_likes: boolean
          notif_mentions: boolean
          notif_messages: boolean
          notif_recommendations: boolean
          show_activity: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discoverable?: boolean
          dm_privacy?: string
          notif_comments?: boolean
          notif_follows?: boolean
          notif_likes?: boolean
          notif_mentions?: boolean
          notif_messages?: boolean
          notif_recommendations?: boolean
          show_activity?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discoverable?: boolean
          dm_privacy?: string
          notif_comments?: boolean
          notif_follows?: boolean
          notif_likes?: boolean
          notif_mentions?: boolean
          notif_messages?: boolean
          notif_recommendations?: boolean
          show_activity?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_notes: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          owner_id: string
          url: string
          waveform: Json | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          owner_id: string
          url: string
          waveform?: Json | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          owner_id?: string
          url?: string
          waveform?: Json | null
        }
        Relationships: []
      }
      watch_events: {
        Row: {
          completed: boolean
          created_at: string
          episode_id: string | null
          id: string
          ms_watched: number
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          episode_id?: string | null
          id?: string
          ms_watched?: number
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          episode_id?: string | null
          id?: string
          ms_watched?: number
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_events_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "tv_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_tokens_to_maiki: {
        Args: { _tokens: number }
        Returns: {
          address: string
          balance: number
          created_at: string
          locked: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "maiki_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dating_deck: {
        Args: { _limit?: number; _user: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          display_name: string
          gender: string
          interests: string[]
          location: string
          looking_for: string
          photos: string[]
          user_id: string
          username: string
        }[]
      }
      ensure_maiki_wallet: {
        Args: { _user: string }
        Returns: {
          address: string
          balance: number
          created_at: string
          locked: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "maiki_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_twin_being: {
        Args: { _user: string }
        Returns: {
          accent: string
          avatar_url: string | null
          created_at: string
          hire_rate: number
          id: string
          is_public: boolean
          kind: string
          model: string
          name: string
          owner_id: string
          personality: string
          purpose: string | null
          role: string
          runs: number
          skills: string[]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "smai_beings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hire_being: {
        Args: { _being_id: string; _note?: string }
        Returns: number
      }
      increment_episode_view: {
        Args: { _episode_id: string }
        Returns: undefined
      }
      increment_post_view: { Args: { _post_id: string }; Returns: undefined }
      is_dm_member: {
        Args: { _thread: string; _user: string }
        Returns: boolean
      }
      is_space_admin: {
        Args: { _space: string; _user: string }
        Returns: boolean
      }
      is_space_member: {
        Args: { _space: string; _user: string }
        Returns: boolean
      }
      my_postable_spaces: {
        Args: { _user: string }
        Returns: {
          avatar_url: string
          can_post: boolean
          id: string
          kind: string
          name: string
          slug: string
        }[]
      }
      recommended_spaces: {
        Args: { _kind?: string; _limit?: number; _user: string }
        Returns: {
          reason: string
          score: number
          space_id: string
        }[]
      }
      redeem_space_invite: { Args: { _code: string }; Returns: string }
      search_all: {
        Args: { _limit?: number; _q: string }
        Returns: {
          id: string
          kind: string
          name: string
          score: number
          slug: string
          snippet: string
        }[]
      }
      send_maiki: {
        Args: { _amount: number; _note?: string; _to_address: string }
        Returns: {
          address: string
          balance: number
          created_at: string
          locked: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "maiki_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      space_analytics: {
        Args: { _space: string; _window_days?: number }
        Returns: Json
      }
      suggested_people: {
        Args: { _limit?: number; _user: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          id: string
          mutuals: number
          reason: string
          reputation: number
          shared_interests: number
          title: string
          username: string
        }[]
      }
      tip_post: { Args: { _amount: number; _post_id: string }; Returns: number }
      trending_posts: {
        Args: { _limit?: number }
        Returns: {
          post_id: string
          score: number
        }[]
      }
      viral_posts: {
        Args: { _limit?: number; _window_hours?: number }
        Returns: {
          container_id: string
          container_name: string
          container_slug: string
          container_type: string
          post_id: string
          score: number
        }[]
      }
      wants_notification: {
        Args: { _kind: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      community_kind: "kons" | "waides" | "smai"
      notification_priority: "important" | "social" | "system"
      post_type: "article" | "reel" | "image" | "ai_insight" | "discussion"
      reaction_kind:
        | "like"
        | "fire"
        | "insightful"
        | "support"
        | "genius"
        | "respect"
      report_status: "open" | "reviewed" | "dismissed"
      space_kind: "group" | "page" | "circle"
      space_role: "admin" | "moderator" | "member"
      space_visibility: "public" | "private" | "invite_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      community_kind: ["kons", "waides", "smai"],
      notification_priority: ["important", "social", "system"],
      post_type: ["article", "reel", "image", "ai_insight", "discussion"],
      reaction_kind: [
        "like",
        "fire",
        "insightful",
        "support",
        "genius",
        "respect",
      ],
      report_status: ["open", "reviewed", "dismissed"],
      space_kind: ["group", "page", "circle"],
      space_role: ["admin", "moderator", "member"],
      space_visibility: ["public", "private", "invite_only"],
    },
  },
} as const
