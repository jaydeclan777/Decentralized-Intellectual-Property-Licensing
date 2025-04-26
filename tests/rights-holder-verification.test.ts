import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  rightsHolders: new Map(),
  blockHeight: 100,
  
  isAdmin(caller) {
    return caller === this.admin;
  },
  
  verifyRightsHolder(caller, address, verificationMethod) {
    if (!this.isAdmin(caller)) {
      return { type: 'err', value: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    if (this.rightsHolders.has(address)) {
      return { type: 'err', value: 101 }; // ERR-ALREADY-VERIFIED
    }
    
    this.rightsHolders.set(address, {
      verified: true,
      verificationDate: this.blockHeight,
      verificationMethod
    });
    
    return { type: 'ok', value: true };
  },
  
  revokeVerification(caller, address) {
    if (!this.isAdmin(caller)) {
      return { type: 'err', value: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    if (!this.rightsHolders.has(address)) {
      return { type: 'err', value: 102 }; // ERR-NOT-FOUND
    }
    
    this.rightsHolders.delete(address);
    return { type: 'ok', value: true };
  },
  
  isVerifiedRightsHolder(address) {
    const holder = this.rightsHolders.get(address);
    return {
      type: 'ok',
      value: holder ? holder.verified : false
    };
  },
  
  getVerificationDetails(address) {
    return this.rightsHolders.get(address) || null;
  },
  
  setAdmin(caller, newAdmin) {
    if (!this.isAdmin(caller)) {
      return { type: 'err', value: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    this.admin = newAdmin;
    return { type: 'ok', value: newAdmin };
  }
};

describe('Rights Holder Verification Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.rightsHolders = new Map();
    mockContract.blockHeight = 100;
  });
  
  it('should verify a rights holder when called by admin', () => {
    const result = mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(mockContract.rightsHolders.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(true);
    
    const details = mockContract.getVerificationDetails('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(details).toEqual({
      verified: true,
      verificationDate: 100,
      verificationMethod: 'KYC verification'
    });
  });
  
  it('should not verify a rights holder when called by non-admin', () => {
    const result = mockContract.verifyRightsHolder(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    expect(result).toEqual({ type: 'err', value: 100 }); // ERR-NOT-AUTHORIZED
    expect(mockContract.rightsHolders.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(false);
  });
  
  it('should not verify an already verified rights holder', () => {
    // First verification
    mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    // Second verification attempt
    const result = mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'Document verification'
    );
    
    expect(result).toEqual({ type: 'err', value: 101 }); // ERR-ALREADY-VERIFIED
  });
  
  it('should revoke verification when called by admin', () => {
    // First verify
    mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    // Then revoke
    const result = mockContract.revokeVerification(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(mockContract.rightsHolders.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(false);
  });
  
  it('should not revoke verification when called by non-admin', () => {
    // First verify
    mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    // Attempt to revoke by non-admin
    const result = mockContract.revokeVerification(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    );
    
    expect(result).toEqual({ type: 'err', value: 100 }); // ERR-NOT-AUTHORIZED
    expect(mockContract.rightsHolders.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(true);
  });
  
  it('should correctly check if an address is verified', () => {
    // Verify an address
    mockContract.verifyRightsHolder(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'KYC verification'
    );
    
    // Check verified address
    let result = mockContract.isVerifiedRightsHolder('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(result).toEqual({ type: 'ok', value: true });
    
    // Check unverified address
    result = mockContract.isVerifiedRightsHolder('ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WZ5S');
    expect(result).toEqual({ type: 'ok', value: false });
  });
  
  it('should allow admin to change admin', () => {
    const result = mockContract.setAdmin(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WZ5S'
    );
    
    expect(result).toEqual({ type: 'ok', value: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WZ5S' });
    expect(mockContract.admin).toBe('ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WZ5S');
  });
  
  it('should not allow non-admin to change admin', () => {
    const result = mockContract.setAdmin(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WZ5S'
    );
    
    expect(result).toEqual({ type: 'err', value: 100 }); // ERR-NOT-AUTHORIZED
    expect(mockContract.admin).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  });
});
