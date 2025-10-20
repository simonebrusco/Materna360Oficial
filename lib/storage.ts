import { supabase } from './supabase'

export const uploadToStorage = async (
  file: File,
  bucket: string,
  path: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return null
    }

    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl.publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

export const deleteFromStorage = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}
