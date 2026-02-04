import { supabase } from '../lib/supabaseClient';
import { NarrationResult } from '../types';
import { VOICES } from '../constants';

export const cloudService = {
    async uploadNarration(
        blob: Blob,
        metadata: {
            text: string;
            voiceId: string;
            emotion: string;
            projectTitle?: string;
        }
    ): Promise<NarrationResult | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('narrations')
                .upload(fileName, blob, {
                    contentType: 'audio/wav',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('narrations')
                .getPublicUrl(fileName);

            // 3. Save Metadata to DB
            const { data: insertData, error: dbError } = await supabase
                .from('narrations')
                .insert({
                    user_id: user.id,
                    project_title: metadata.projectTitle || 'Sin Título',
                    text_content: metadata.text,
                    audio_path: fileName,
                    voice_id: metadata.voiceId,
                    emotion: metadata.emotion
                })
                .select()
                .single();

            if (dbError) throw dbError;

            const voiceName = VOICES.find(v => v.id === metadata.voiceId)?.name || metadata.voiceId;

            return {
                id: insertData.id,
                audioUrl: publicUrl,
                timestamp: new Date(insertData.created_at).getTime(),
                text: metadata.text,
                voiceName: voiceName
            };

        } catch (error) {
            console.error('Cloud Sync Error:', error);
            return null;
        }
    },

    async fetchUserNarrations(): Promise<NarrationResult[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('narrations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((row: any) => {
                const { data: { publicUrl } } = supabase.storage
                    .from('narrations')
                    .getPublicUrl(row.audio_path);

                const voiceName = VOICES.find(v => v.id === row.voice_id)?.name || row.voice_id;
                const finalVoiceName = typeof voiceName === 'string' ? voiceName : 'Voz Desconocida';

                return {
                    id: row.id,
                    audioUrl: publicUrl,
                    timestamp: new Date(row.created_at).getTime(),
                    text: row.text_content || '',
                    voiceName: finalVoiceName,
                    storagePath: row.audio_path // Keep track of path for deletion
                };
            });
        } catch (error) {
            console.error('Fetch Cloud Error:', error);
            return [];
        }
    },

    async deleteNarration(id: string, storagePath?: string): Promise<boolean> {
        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('narrations')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage (if path known)
            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('narrations')
                    .remove([storagePath]);

                if (storageError) console.warn("Storage delete warning:", storageError);
            }

            return true;
        } catch (error) {
            console.error('Delete Error:', error);
            return false;
        }
    }
};
