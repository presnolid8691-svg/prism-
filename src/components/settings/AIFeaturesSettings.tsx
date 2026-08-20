'use client'
import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export function AIFeaturesSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI & Smart Features</h3>
        <p className="text-sm text-zinc-500">Configure machine learning and automation settings to enhance your chat experience.</p>
      </div>

      <div className="space-y-4">
        {/* Feature 1 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Smart Replies</h3>
            <p className="text-sm text-zinc-500">AI-generated quick reply suggestions based on chat context.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 2 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Auto-Translation</h3>
            <p className="text-sm text-zinc-500">Automatically translate incoming messages to your system language.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 3 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Message Summarization</h3>
            <p className="text-sm text-zinc-500">Condense long messages and threads into quick summaries.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 4 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">AI Avatars</h3>
            <p className="text-sm text-zinc-500">Generate a personalized dynamic avatar based on your activity.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 5 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Voice-to-Text Dictation</h3>
            <p className="text-sm text-zinc-500">Real-time voice dictation with punctuation awareness.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 6 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Sentiment Analysis</h3>
            <p className="text-sm text-zinc-500">Show subtle mood indicators on messages based on text sentiment.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 7 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">AI Spam Filter</h3>
            <p className="text-sm text-zinc-500">Aggressively block promotional or suspicious messages.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 8 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Auto-Correct AI</h3>
            <p className="text-sm text-zinc-500">Context-aware typo and grammar corrections as you type.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 9 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Magic Compose</h3>
            <p className="text-sm text-zinc-500">Draft full responses from short prompts or keywords.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 10 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">AI Generated Themes</h3>
            <p className="text-sm text-zinc-500">Automatically adapt chat colors based on chat content and time of day.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 11 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Communication Analytics</h3>
            <p className="text-sm text-zinc-500">Generate weekly insights about your messaging habits.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 12 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Read-Receipt Ghost Mode</h3>
            <p className="text-sm text-zinc-500">Smartly mask read receipts depending on sender priority.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 13 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">AI Scheduled Messages</h3>
            <p className="text-sm text-zinc-500">Predict the best time to send messages based on recipient's timezone and habits.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 14 */}
        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Auto-Delete Timer (Hours)</h3>
            <p className="text-sm text-zinc-500">Automatically wipe ephemeral messages.</p>
          </div>
          <Slider defaultValue={[24]} min={1} max={72} step={1} />
        </div>

        {/* Feature 15 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Profanity Filter</h3>
            <p className="text-sm text-zinc-500">Censor inappropriate language using neural networks.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 16 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Priority Inbox</h3>
            <p className="text-sm text-zinc-500">Sort direct messages by importance and urgency.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 17 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Smart Search (Semantic)</h3>
            <p className="text-sm text-zinc-500">Search by meaning rather than exact keywords.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 18 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">File OCR (Optical Character Recognition)</h3>
            <p className="text-sm text-zinc-500">Extract text from uploaded images and documents automatically.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 19 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Audio Transcription</h3>
            <p className="text-sm text-zinc-500">Automatically transcribe incoming voice memos.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 20 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Video Summaries</h3>
            <p className="text-sm text-zinc-500">Create short text synopses of shared video clips.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 21 */}
        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Default Tone Adjustment</h3>
            <p className="text-sm text-zinc-500">AI adjusts your drafted messages to match a specific tone.</p>
          </div>
          <Select defaultValue="neutral">
            <option value="neutral">Neutral</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual / Friendly</option>
            <option value="direct">Direct & Concise</option>
          </Select>
        </div>

        {/* Feature 22 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Auto-Suggest Emojis</h3>
            <p className="text-sm text-zinc-500">Recommend relevant emojis based on sentence context.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 23 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Grammar & Style Enhancer</h3>
            <p className="text-sm text-zinc-500">Advanced styling tips to improve text clarity before sending.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 24 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Automatic Meeting Scheduler</h3>
            <p className="text-sm text-zinc-500">Detect calendar intents and propose times to meet automatically.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 25 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Photo Enhancer & Upscaler</h3>
            <p className="text-sm text-zinc-500">Automatically upscale and denoise photos before sending.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 26 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Code Snippet Explainer</h3>
            <p className="text-sm text-zinc-500">Inline explanation tooltips for raw code shared in chat.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 27 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Smart Reminders & Nudges</h3>
            <p className="text-sm text-zinc-500">Reminds you to follow up on messages left unanswered for 24h.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 28 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Context-Aware Auto-Tags</h3>
            <p className="text-sm text-zinc-500">Automatically apply topic labels to group chats for easy sorting.</p>
          </div>
          <Switch />
        </div>

        {/* Feature 29 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Link Previews with AI Summary</h3>
            <p className="text-sm text-zinc-500">Generate a 2-sentence breakdown of any shared URL.</p>
          </div>
          <Switch defaultChecked />
        </div>

        {/* Feature 30 */}
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Smart Contact Clustering</h3>
            <p className="text-sm text-zinc-500">Suggest new group chats based on overlapping conversational networks.</p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}
