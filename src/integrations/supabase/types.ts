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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      diagnostic_responses: {
        Row: {
          ai_summary: string | null
          answers: Json | null
          created_at: string
          id: string
          lead_celular: string | null
          lead_email: string
          lead_empresa: string | null
          lead_id: string | null
          lead_nome: string
          maturity_level: string | null
          meeting_date: string | null
          meeting_summary: Json | null
          meeting_time: string | null
          meeting_transcription: string | null
          questions: Json
          sala_id: string | null
          sala_nome: string | null
          score_gestao: number | null
          score_ia: number | null
          score_total: number | null
          setor: string
        }
        Insert: {
          ai_summary?: string | null
          answers?: Json | null
          created_at?: string
          id?: string
          lead_celular?: string | null
          lead_email: string
          lead_empresa?: string | null
          lead_id?: string | null
          lead_nome?: string
          maturity_level?: string | null
          meeting_date?: string | null
          meeting_summary?: Json | null
          meeting_time?: string | null
          meeting_transcription?: string | null
          questions?: Json
          sala_id?: string | null
          sala_nome?: string | null
          score_gestao?: number | null
          score_ia?: number | null
          score_total?: number | null
          setor?: string
        }
        Update: {
          ai_summary?: string | null
          answers?: Json | null
          created_at?: string
          id?: string
          lead_celular?: string | null
          lead_email?: string
          lead_empresa?: string | null
          lead_id?: string | null
          lead_nome?: string
          maturity_level?: string | null
          meeting_date?: string | null
          meeting_summary?: Json | null
          meeting_time?: string | null
          meeting_transcription?: string | null
          questions?: Json
          sala_id?: string | null
          sala_nome?: string | null
          score_gestao?: number | null
          score_ia?: number | null
          score_total?: number | null
          setor?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_responses_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          lead_id: string | null
          recipient_email: string
          recipient_name: string | null
          resend_id: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          resend_id?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          resend_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          apex_session_id: string | null
          cargo: string | null
          confirmou_participacao: boolean
          copy_variant: string | null
          created_at: string
          data_reuniao: string | null
          deseja_contato_vendedor: boolean | null
          email: string
          empresa: string
          etapa_pipedrive: string | null
          faturamento: string | null
          fbclid: string | null
          funcionarios: string | null
          gad_campaignid: string | null
          gad_source: string | null
          gbraid: string | null
          gclid: string | null
          horario_reuniao: string | null
          id: string
          landing_page: string | null
          lembrete_enviado: boolean
          li_fat_id: string | null
          ligacao_agendada: boolean
          ligacao_confirmacao_enviada: boolean
          link_reuniao: string | null
          manychat_subscriber_id: string | null
          msclkid: string | null
          nome: string
          nps: number | null
          oque_faz: string | null
          origin_page: string | null
          pipedrive_deal_id: number | null
          pipedrive_org_id: number | null
          pipedrive_person_id: number | null
          prioridade: string | null
          reschedule_token: string | null
          sck: string | null
          session_attributes_encoded: string | null
          sobrenome: string | null
          software_gestao: string | null
          status: string
          status_reuniao: string | null
          ttclid: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          wbraid: string | null
          whatsapp: string
        }
        Insert: {
          apex_session_id?: string | null
          cargo?: string | null
          confirmou_participacao?: boolean
          copy_variant?: string | null
          created_at?: string
          data_reuniao?: string | null
          deseja_contato_vendedor?: boolean | null
          email: string
          empresa: string
          etapa_pipedrive?: string | null
          faturamento?: string | null
          fbclid?: string | null
          funcionarios?: string | null
          gad_campaignid?: string | null
          gad_source?: string | null
          gbraid?: string | null
          gclid?: string | null
          horario_reuniao?: string | null
          id?: string
          landing_page?: string | null
          lembrete_enviado?: boolean
          li_fat_id?: string | null
          ligacao_agendada?: boolean
          ligacao_confirmacao_enviada?: boolean
          link_reuniao?: string | null
          manychat_subscriber_id?: string | null
          msclkid?: string | null
          nome: string
          nps?: number | null
          oque_faz?: string | null
          origin_page?: string | null
          pipedrive_deal_id?: number | null
          pipedrive_org_id?: number | null
          pipedrive_person_id?: number | null
          prioridade?: string | null
          reschedule_token?: string | null
          sck?: string | null
          session_attributes_encoded?: string | null
          sobrenome?: string | null
          software_gestao?: string | null
          status?: string
          status_reuniao?: string | null
          ttclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
          whatsapp: string
        }
        Update: {
          apex_session_id?: string | null
          cargo?: string | null
          confirmou_participacao?: boolean
          copy_variant?: string | null
          created_at?: string
          data_reuniao?: string | null
          deseja_contato_vendedor?: boolean | null
          email?: string
          empresa?: string
          etapa_pipedrive?: string | null
          faturamento?: string | null
          fbclid?: string | null
          funcionarios?: string | null
          gad_campaignid?: string | null
          gad_source?: string | null
          gbraid?: string | null
          gclid?: string | null
          horario_reuniao?: string | null
          id?: string
          landing_page?: string | null
          lembrete_enviado?: boolean
          li_fat_id?: string | null
          ligacao_agendada?: boolean
          ligacao_confirmacao_enviada?: boolean
          link_reuniao?: string | null
          manychat_subscriber_id?: string | null
          msclkid?: string | null
          nome?: string
          nps?: number | null
          oque_faz?: string | null
          origin_page?: string | null
          pipedrive_deal_id?: number | null
          pipedrive_org_id?: number | null
          pipedrive_person_id?: number | null
          prioridade?: string | null
          reschedule_token?: string | null
          sck?: string | null
          session_attributes_encoded?: string | null
          sobrenome?: string | null
          software_gestao?: string | null
          status?: string
          status_reuniao?: string | null
          ttclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      manychat_flow_logs: {
        Row: {
          created_at: string
          flow_name: string
          id: string
          lead_id: string | null
          message_preview: string | null
          raw_payload: Json | null
          step_name: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          flow_name?: string
          id?: string
          lead_id?: string | null
          message_preview?: string | null
          raw_payload?: Json | null
          step_name?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          flow_name?: string
          id?: string
          lead_id?: string | null
          message_preview?: string | null
          raw_payload?: Json | null
          step_name?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "manychat_flow_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean
          layout_type: string
          slide_order: number
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          layout_type?: string
          slide_order?: number
          title?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          layout_type?: string
          slide_order?: number
          title?: string
        }
        Relationships: []
      }
      roleta_counter: {
        Row: {
          current_index: number
          id: number
        }
        Insert: {
          current_index?: number
          id?: number
        }
        Update: {
          current_index?: number
          id?: number
        }
        Relationships: []
      }
      sala_horarios: {
        Row: {
          ativo: boolean
          created_at: string
          data_especifica: string | null
          dia_semana: number | null
          horario: string
          id: string
          sala_id: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_especifica?: string | null
          dia_semana?: number | null
          horario: string
          id?: string
          sala_id: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_especifica?: string | null
          dia_semana?: number | null
          horario?: string
          id?: string
          sala_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sala_horarios_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      sala_presencas: {
        Row: {
          created_at: string
          data_sessao: string
          email: string
          empresa: string | null
          horario_id: string
          id: string
          ligacao_confirmacao_enviada: boolean
          nome: string
          sala_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          data_sessao: string
          email: string
          empresa?: string | null
          horario_id: string
          id?: string
          ligacao_confirmacao_enviada?: boolean
          nome: string
          sala_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          data_sessao?: string
          email?: string
          empresa?: string | null
          horario_id?: string
          id?: string
          ligacao_confirmacao_enviada?: boolean
          nome?: string
          sala_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sala_presencas_horario_id_fkey"
            columns: ["horario_id"]
            isOneToOne: false
            referencedRelation: "sala_horarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sala_presencas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          link_sala: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          link_sala?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          link_sala?: string
          nome?: string
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
      vendedores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome: string
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      digits_only: { Args: { "": string }; Returns: string }
      find_lead_by_phone: {
        Args: { phone_digits: string }
        Returns: {
          apex_session_id: string | null
          cargo: string | null
          confirmou_participacao: boolean
          copy_variant: string | null
          created_at: string
          data_reuniao: string | null
          deseja_contato_vendedor: boolean | null
          email: string
          empresa: string
          etapa_pipedrive: string | null
          faturamento: string | null
          fbclid: string | null
          funcionarios: string | null
          gad_campaignid: string | null
          gad_source: string | null
          gbraid: string | null
          gclid: string | null
          horario_reuniao: string | null
          id: string
          landing_page: string | null
          lembrete_enviado: boolean
          li_fat_id: string | null
          ligacao_agendada: boolean
          ligacao_confirmacao_enviada: boolean
          link_reuniao: string | null
          manychat_subscriber_id: string | null
          msclkid: string | null
          nome: string
          nps: number | null
          oque_faz: string | null
          origin_page: string | null
          pipedrive_deal_id: number | null
          pipedrive_org_id: number | null
          pipedrive_person_id: number | null
          prioridade: string | null
          reschedule_token: string | null
          sck: string | null
          session_attributes_encoded: string | null
          sobrenome: string | null
          software_gestao: string | null
          status: string
          status_reuniao: string | null
          ttclid: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          wbraid: string | null
          whatsapp: string
        }[]
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "cs"
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
      app_role: ["admin", "vendedor", "cs"],
    },
  },
} as const
