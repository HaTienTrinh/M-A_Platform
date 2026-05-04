'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  dealId: string;
  docType: 'nda' | 'loi' | 'spa';
  defaultData: any;
  onSuccess: () => void;
}

export function DocumentGenerator({ dealId, docType, defaultData, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(defaultData)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/legal/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          docType,
          templateData: formData
        })
      });

      if (!res.ok) throw new Error('Failed to generate document');
      
      toast.success('Document generated successfully');
      onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {docType === 'nda' && (
        <>
          <div>
            <Label>Receiving Party (Buyer Name)</Label>
            <Input name="buyerName" value={formData.buyerName} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Disclosing Party (Seller Company)</Label>
            <Input name="sellerCompany" value={formData.sellerCompany} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Deal Name</Label>
            <Input name="dealName" value={formData.dealName} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Date</Label>
            <Input name="date" type="date" value={formData.date} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
        </>
      )}

      {docType === 'loi' && (
        <>
          <div>
            <Label>Buyer Name</Label>
            <Input name="buyerName" value={formData.buyerName} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Seller Company</Label>
            <Input name="sellerCompany" value={formData.sellerCompany} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Proposed Valuation</Label>
            <Input name="valuation" value={formData.valuation} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" placeholder="$5,000,000" />
          </div>
          <div>
            <Label>Equity %</Label>
            <Input name="equityPercent" type="number" value={formData.equityPercent} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" placeholder="100" />
          </div>
          <div>
            <Label>Expected Closing Date</Label>
            <Input name="closingDate" type="date" value={formData.closingDate} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Conditions (Optional)</Label>
            <Input name="conditions" value={formData.conditions} onChange={handleChange} className="bg-zinc-900 border-zinc-800" />
          </div>
        </>
      )}

      {docType === 'spa' && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Buyer Legal Name</Label>
              <Input name="buyerName" value={formData.buyerName} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <Label>Seller Legal Name</Label>
              <Input name="sellerName" value={formData.sellerName} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div>
            <Label>Agreement Date</Label>
            <Input name="date" type="date" value={formData.date} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Purchase Price (Valuation)</Label>
              <Input name="valuation" value={formData.valuation} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" placeholder="$10,000,000" />
            </div>
            <div>
              <Label>Equity % Being Sold</Label>
              <Input name="equityPercent" type="number" value={formData.equityPercent} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" placeholder="100" />
            </div>
          </div>
          <div>
            <Label>Completion (Closing) Date</Label>
            <Input name="completionDate" type="date" value={formData.completionDate} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <Label>Payment Terms</Label>
            <Input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} required className="bg-zinc-900 border-zinc-800" placeholder="e.g. 80% on completion, 20% held in escrow" />
          </div>
          <div>
            <Label>Governing Law / Jurisdiction</Label>
            <select 
              name="governingLaw" 
              value={formData.governingLaw} 
              onChange={(e: any) => setFormData({ ...formData, governingLaw: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Vietnam">Vietnam</option>
              <option value="Singapore">Singapore</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="USA (Delaware)">USA (Delaware)</option>
            </select>
          </div>
          <div>
            <Label>Conditions Precedent</Label>
            <textarea 
              name="conditions" 
              value={formData.conditions} 
              onChange={(e: any) => setFormData({ ...formData, conditions: e.target.value })}
              className="w-full h-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="List specific conditions..."
            />
          </div>
          <div>
            <Label>Warranties</Label>
            <textarea 
              name="warranties" 
              value={formData.warranties} 
              onChange={(e: any) => setFormData({ ...formData, warranties: e.target.value })}
              className="w-full h-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="List specific warranties..."
            />
          </div>
          <div>
            <Label>Covenants</Label>
            <textarea 
              name="covenants" 
              value={formData.covenants} 
              onChange={(e: any) => setFormData({ ...formData, covenants: e.target.value })}
              className="w-full h-24 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="List specific covenants..."
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate {docType.toUpperCase()} Document
      </Button>
    </form>
  )
}
