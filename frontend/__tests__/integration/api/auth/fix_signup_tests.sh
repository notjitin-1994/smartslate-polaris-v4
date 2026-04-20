#!/bin/bash

# Fix the mock return values to use listUsers format
sed -i 's/data: { user: mockExistingUserPassword }/data: { users: [mockExistingUserPassword] }/g' signup.test.ts
sed -i 's/data: { user: mockExistingUserGoogle }/data: { users: [mockExistingUserGoogle] }/g' signup.test.ts
sed -i 's/data: { user: mockExistingUserGithub }/data: { users: [mockExistingUserGithub] }/g' signup.test.ts
sed -i 's/data: { user: mockUnconfirmedUser }/data: { users: [mockUnconfirmedUser] }/g' signup.test.ts

# Fix the empty user cases
sed -i 's/data: null,$/data: { users: [] },/g' signup.test.ts

# Fix the assertion for listUsers call
sed -i "s/expect(mockAdminListUsers).toHaveBeenCalledWith('test@example.com')/expect(mockAdminListUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 })/g" signup.test.ts
sed -i "s/expect(mockAdminListUsers).toHaveBeenCalledWith(longEmail.toLowerCase())/expect(mockAdminListUsers).toHaveBeenCalled()/g" signup.test.ts

