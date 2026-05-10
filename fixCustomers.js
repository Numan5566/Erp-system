const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Customers.jsx');
let src = fs.readFileSync(p, 'utf-8');

const target = '  const [search, setSearch] = useState("");';

const injection = `  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  
  const calculatedLedgerData = useMemo(() => {
    if (!selectedCustomer) return [];
    
    const sortedAsc = [...ledgerData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const totalLedgerEffect = sortedAsc.reduce((sum, row) => {
      return sum + (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
    }, 0);
    
    const startingPoint = parseFloat(selectedCustomer.balance || 0) - totalLedgerEffect;
    
    const openingRow = {
      id: 'opening-bal-synthetic',
      created_at: sortedAsc.length > 0 ? new Date(new Date(sortedAsc[0].created_at).getTime() - 1000 * 60).toISOString() : new Date().toISOString(),
      total_amount: 0,
      paid_amount: 0,
      is_opening: true,
      custom_label: 'Opening Balance / Brought Forward',
      running_balance: startingPoint
    };
    
    let currentTracker = startingPoint;
    const withRunning = sortedAsc.map(row => {
      currentTracker += (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
      return { ...row, running_balance: currentTracker };
    });
    
    return [openingRow, ...withRunning];
  }, [ledgerData, selectedCustomer]);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");`;

src = src.replace(target, injection);

fs.writeFileSync(p, src, 'utf-8');
console.log("CRITICAL: Customers.jsx fixed and ledger memory upgraded.");
