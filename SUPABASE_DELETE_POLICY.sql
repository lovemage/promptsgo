-- 刪除舊的 DELETE 策略（如果存在）
DROP POLICY IF EXISTS "Users can delete own prompts" ON global_prompts;

-- 添加允許認證用戶刪除自己的 prompts 的策略
CREATE POLICY "Users can delete own prompts"
ON global_prompts
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 驗證策略已創建
SELECT * FROM pg_policies WHERE tablename = 'global_prompts' AND policyname = 'Users can delete own prompts';

